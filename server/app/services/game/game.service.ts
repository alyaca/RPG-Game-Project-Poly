import { Navigation } from '@app/classes/navigation/navigation';
import { Stopwatch } from '@app/classes/stopwatch/stopwatch';
import {
    DEFAULT_ATTRIBUTE,
    DISCONNECTED_POSITION,
    EQUAL_ODDS_PROBABILITY,
    FELLING_PROBABILITY,
    HIGH_ATTRIBUTE,
    LogType,
    MOVEMENT_TIME,
    SINGLE_PLAYER,
    STARTING_TIME,
    TileCost,
    TileType,
    TURN_TIME,
} from '@app/constants';
import { DoorActionData } from '@app/interfaces/socket-data.interface';
import { baseBot } from '@app/mocks/mock-players';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { MatchService } from '@app/services/match/match.service';
import { RoomService } from '@app/services/room/room.service';
import { Avatar, Behavior, Player, Position, Status } from '@common/player';
import { GameStatus, Room } from '@common/room';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/* eslint-disable max-lines */
@Injectable()
export class GameService {
    isMoving: boolean = false;
    isTurnSkipped: boolean = false;

    constructor(
        private roomService: RoomService,
        private gameLogsService: GameLogsService,
        private matchService: MatchService,
    ) {}

    connectPlayerToGame(roomId: string) {
        const game = this.getGame(roomId);
        if (!this.isCodeFormatValid(roomId)) {
            return { event: 'joinError', errorType: 'invalidFormat' };
        }
        if (!this.roomService.isRoomActive(roomId)) {
            return { event: 'joinError', errorType: 'roomNotFound' };
        }
        if (game.isLocked) {
            return { event: 'joinError', errorType: 'roomLocked' };
        }
        return { event: 'joinedRoom' };
    }

    createPlayer(room: Room, player: Player, socket: Socket) {
        if (player.status !== Status.Bot) {
            player.id = socket.id;
            if (this.roomService.isPlayerAdmin(socket)) {
                player.status = Status.Admin;
            }
            this.setUniquePlayerName(player, socket, true);
        } else {
            this.setUniquePlayerName(player, socket, false);
        }
        room.listPlayers.push(player);
        const takenAvatar = this.getAvatarByName(room, player.avatar);
        takenAvatar.isTaken = true;
    }

    getActivePlayer(room: Room): Player {
        return room.listPlayers.find((player) => player.isActive === true);
    }

    getGame(roomId) {
        return this.roomService.rooms.get(roomId);
    }

    getPlayerById(room: Room, socket: Socket) {
        return room.listPlayers.find((player) => player.id === socket.id);
    }

    leavePlayerFromGame(roomId: string, socket: Socket, server: Server) {
        const isAdmin = this.roomService.isPlayerAdmin(socket);
        const room = this.roomService.getRoom(socket);
        socket.emit('leftRoom', isAdmin);
        const player = this.getPlayerById(room, socket);
        this.gameLogsService.sendPlayerLog(roomId, server, player, LogType.GiveUp);

        if (isAdmin && room.isDebug) {
            room.isDebug = false;
            server.to(roomId).emit('debugMode', false);
        }
        if (isAdmin && room.gameStatus === GameStatus.Lobby) {
            this.roomService.deleteRoom(roomId, socket);
        } else if (room.gameStatus === GameStatus.Started) {
            this.playerDisconnected(room, socket, server);
            socket.to(roomId).emit('disconnectedPlayer', room.listPlayers);
            const activePlayer = this.getActivePlayer(room);
            player.position = DISCONNECTED_POSITION;
            if (activePlayer.id !== player.id) {
                const reachability = room.navigation.findReachableTiles(activePlayer, room);
                server.to(room.roomId).emit('reachableTiles', reachability);
            }
        } else {
            this.removePlayerFromRoom(roomId, socket, server);
            socket.to(roomId).emit('updatedPlayer', room);
        }
    }

    selectedAvatar(room: Room, avatar: Avatar, socket: Socket, server: Server) {
        this.freeUpAvatar(room, socket);
        const selectedAvatar = this.getAvatarByName(room, avatar);
        if (selectedAvatar && !selectedAvatar.isTaken) {
            selectedAvatar.isTaken = true;
            socket.data.clickedAvatar = selectedAvatar;
            this.updateAvatarsForAllClients(server, room.roomId);
        }
    }

    stopGameTimers(room: Room) {
        this.roomService.getFightTimer(room.roomId).stopTimer();
        this.roomService.getTurnTimer(room.roomId).stopTimer();
    }

    removePlayerFromRoom(roomId: string, socket: Socket, server: Server) {
        const room = this.roomService.rooms.get(roomId);
        room.listPlayers = room.listPlayers.filter((player) => player.id !== socket.id);
        this.freeUpAvatar(room, socket);
        this.updateAvatarsForAllClients(server, roomId);
        this.roomService.leaveRoom(roomId, socket);
    }

    toggleLockRoom(roomId: string, isLocked: boolean) {
        const game = this.getGame(roomId);
        game.isLocked = isLocked;
    }

    onStartGame(socket: Socket, server: Server) {
        const room = this.roomService.getRoom(socket);
        room.stopwatch = new Stopwatch();
        room.stopwatch.start();
        room.navigation = new Navigation(room.gameMap, room.gameMap.itemPlacement, room.listPlayers);
        this.matchService.processMapObjects(socket);
        room.gameStatus = GameStatus.Started;
        this.sortPlayersBySpeed(room);
        room.listPlayers[0].isActive = true;
        this.emitStartGameEvents(room, server);
    }

    emitStartGameEvents(room: Room, server: Server) {
        const activePlayer = this.getActivePlayer(room);
        server.to(room.roomId).emit('startGame', room);
        server.to(room.roomId).emit('mapInformation', room);
        server.to(room.roomId).emit('isActive', activePlayer);
        const reachability = room.navigation.findReachableTiles(activePlayer, room);
        server.to(room.roomId).emit('reachableTiles', reachability);
        this.checkActions(room, server);
    }

    onStartTurn(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const activePlayer = this.getActivePlayer(room);

        server.to(room.roomId).emit('otherPlayerTurn', activePlayer.name);
        this.gameLogsService.sendPlayerLog(room.roomId, server, activePlayer, LogType.StartTurn);

        this.roomService.getTurnTimer(room.roomId).startTimer(STARTING_TIME, (timeRemaining) => {
            server.to(activePlayer.id).emit('beforeStartTurnTimer', timeRemaining);
            if (timeRemaining <= 0) {
                this.playerTurnTimer(client, server);
            }
        });
    }

    onTurnEnded(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);

        if (!this.isMoving) {
            room.globalPostGameStats.turns++;
            this.updateActivePlayer(client);
            const activePlayer = this.getActivePlayer(room);
            activePlayer.attributes.actionPoints = activePlayer.attributes.maxActionPoints;
            activePlayer.attributes.movementPointsLeft = activePlayer.attributes.speed;
            server.to(room.roomId).emit('reachability', activePlayer);
            server.to(room.roomId).emit('isActive', activePlayer);
            server.to(room.roomId).emit('turnEnded', room.listPlayers);
            const reachability = room.navigation.findReachableTiles(activePlayer, room);
            server.to(room.roomId).emit('reachableTiles', reachability);
            this.checkActions(room, server);
        } else {
            this.isTurnSkipped = true;
        }
    }

    assignStatsToBot(bot: Player): Player {
        bot.attributes.attack = Math.random() > EQUAL_ODDS_PROBABILITY ? HIGH_ATTRIBUTE : DEFAULT_ATTRIBUTE;
        bot.attributes.defense = bot.attributes.attack === HIGH_ATTRIBUTE ? DEFAULT_ATTRIBUTE : HIGH_ATTRIBUTE;

        bot.attributes.atkDiceMax = Math.random() > EQUAL_ODDS_PROBABILITY ? HIGH_ATTRIBUTE : DEFAULT_ATTRIBUTE;
        bot.attributes.defDiceMax = bot.attributes.atkDiceMax === HIGH_ATTRIBUTE ? DEFAULT_ATTRIBUTE : HIGH_ATTRIBUTE;

        return bot;
    }

    assignAvatarToBot(room: Room, behavior: Behavior): Player {
        const newBot = JSON.parse(JSON.stringify(baseBot));
        newBot.behavior = behavior;
        const behaviorSuffix = behavior === Behavior.Aggressive ? '-A' : '-D';
        const availableAvatars = room.availableAvatars.filter((avatar) => !avatar.isTaken);
        if (availableAvatars.length > 0) {
            const randomAvatar = availableAvatars[Math.floor(Math.random() * availableAvatars.length)];
            newBot.avatar = randomAvatar;
            newBot.name = `${randomAvatar.name}${behaviorSuffix}-bot`;
            randomAvatar.isTaken = true;
        }
        return newBot;
    }

    updateAvatarsForAllClients(server: Server, roomId: string) {
        server.sockets.sockets.forEach((clientSocket: Socket) => {
            if (clientSocket.rooms.has(roomId)) {
                this.sendAvatarListToClient(clientSocket);
            }
        });
    }

    setUniquePlayerName(player: Player, socket: Socket, updateSocketData: boolean) {
        const playerName = this.generateUniquePlayerName(player.name, socket);
        player.name = playerName;
        if (updateSocketData) {
            socket.data.username = player.name;
        }
    }

    createBot(behavior: Behavior, client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        baseBot.id = (parseInt(baseBot.id, 10) + 1).toString();
        let newBot = this.assignAvatarToBot(room, behavior);
        newBot = this.assignStatsToBot(newBot);
        this.createPlayer(room, newBot, client);
        this.updateAvatarsForAllClients(server, room.roomId);
        server.to(room.roomId).emit('updatedPlayer', room);
    }

    onKickBot(socket: Socket, botId: string, server: Server) {
        const room = this.roomService.getRoom(socket);
        server.to(botId).emit('kickPlayer', botId);
        const botPlayer = room.listPlayers.find((player) => player.id === botId);
        botPlayer.avatar.isTaken = false;
        room.listPlayers = room.listPlayers.filter((player) => player.id !== botId);
        server.to(room.roomId).emit('updatedPlayer', room);
        this.updateAvatarsForAllClients(server, room.roomId);
    }

    onKickPlayer(socket: Socket, server: Server, playerId: string) {
        const room = this.roomService.getRoom(socket);
        server.to(playerId).emit('kickPlayer', playerId);
        const playerSocket = server.sockets.sockets.get(playerId);
        this.removePlayerFromRoom(room.roomId, playerSocket, server);
        server.to(room.roomId).emit('updatedPlayer', room);
    }

    updateLogsDebugMode(isDebugMode: boolean, server: Server, client: Socket) {
        const room = this.roomService.getRoom(client);
        this.gameLogsService.sendDebugLog(isDebugMode, room.roomId, server);
    }

    processTeleportation(room: Room, server: Server, position: Position) {
        const player = this.getActivePlayer(room);
        const playerId = player.id;
        if (room.navigation.isTileValid(position.x, position.y)) {
            player.position = position;
            server.to(room.roomId).emit('teleportPlayer', { position, playerId });
        }
        const reachability = room.navigation.findReachableTiles(player, room);
        server.to(room.roomId).emit('endMovement');
        server.to(room.roomId).emit('reachableTiles', reachability);
        this.checkActions(room, server);
    }

    addUniqueTileToHistory(positionList: Position[], tile: Position) {
        if (!positionList.some((pos) => pos.x === tile.x && pos.y === tile.y)) {
            positionList.push(tile);
        }
    }

    initTileHistory(room: Room) {
        for (const player of room.listPlayers) {
            this.addUniqueTileToHistory(player.positionHistory, player.spawnPosition);
            this.addUniqueTileToHistory(room.globalPostGameStats.globalTilesVisited, player.spawnPosition);
        }
    }

    resetGlobalStats(room: Room) {
        room.globalPostGameStats.globalTilesVisited = [];
        room.globalPostGameStats.doorsInteracted = [];
        room.globalPostGameStats.turns = 1;
        room.globalPostGameStats.nbFlagBearers = 0;
        room.globalPostGameStats.gameDuration = '';
    }

    async processNavigation(room: Room, server: Server, path: Position[], client: Socket) {
        // TODO : refactor this
        const player = this.getActivePlayer(room);
        this.initTileHistory(room); // Should maybe call this function elsewhere
        for (const tile of path) {
            this.isMoving = true;
            player.position = tile;
            this.addUniqueTileToHistory(player.positionHistory, tile);
            this.addUniqueTileToHistory(room.globalPostGameStats.globalTilesVisited, tile);

            if (this.isMoving) {
                await this.delay(MOVEMENT_TIME);
            }
            server.to(room.roomId).emit('playerNavigation', tile);
            if (!room.isDebug) {
                if (room.gameMap.tiles[tile.x][tile.y] === TileType.Ice && !this.checkFell()) {
                    this.stopGameTimers(room);
                    client.emit('playerFell');
                    break;
                }
            }
            if (room.gameMap.tiles[tile.x][tile.y] !== TileType.Ice) {
                player.attributes.movementPointsLeft -= this.getCost(room.gameMap.tiles[tile.x][tile.y]);
            }
        }

        this.isMoving = false;
        const reachability = room.navigation.findReachableTiles(player, room);
        server.to(room.roomId).emit('endMovement');
        server.to(room.roomId).emit('reachableTiles', reachability);
        if (this.checkEndTurn(client, player)) {
            this.onTurnEnded(client, server);
            return;
        }
        if (this.isTurnSkipped) {
            this.onTurnEnded(client, server);
            this.isTurnSkipped = false;
            return;
        }
        this.checkActions(room, server);
    }

    checkActions(room: Room, server: Server) {
        this.checkDoors(room, server);
        this.checkAttack(room, server);
    }

    checkEndTurn(client: Socket, activePlayer: Player): boolean {
        if (!activePlayer || !this.isActivePlayer(client)) return;
        const room = this.roomService.getRoom(client);
        const reachableTileCount = room.navigation.findReachableTiles(activePlayer, room).length;
        const players = room.listPlayers;

        if (!room.navigation.haveActions(activePlayer, players) && reachableTileCount === 0) {
            return true;
        } else if (!room.navigation.hasMovementPoints(activePlayer) && !room.navigation.haveActions(activePlayer, players)) {
            return true;
        } else if (!room.navigation.hasMovementPoints(activePlayer) && !room.navigation.hasActionPoints(activePlayer)) {
            return true;
        }
        return false;
    }

    onEndGame(winner: Player, room: Room, server: Server) {
        room.gameStatus = GameStatus.Ended;
        room.stopwatch.stop();
        room.globalPostGameStats.gameDuration = room.stopwatch.getTime();
        server.to(room.roomId).emit('endGame', { winner, room });
        this.resetGlobalStats(room);
        this.stopGameTimers(room);
    }

    handleDoor(client: Socket, server: Server, doorActionData: DoorActionData) {
        const { clickedPosition, player } = doorActionData;
        const room = this.roomService.getRoom(client);
        const activePlayer = this.getActivePlayer(room);

        if (room.navigation.hasHandleDoorAction(clickedPosition.x, clickedPosition.y, player)) {
            this.addUniqueTileToHistory(room.globalPostGameStats.doorsInteracted, clickedPosition);
            this.gameLogsService.sendDoorLog(room.gameMap.tiles[clickedPosition.x][clickedPosition.y], activePlayer, room.roomId, server);
            activePlayer.attributes.actionPoints = 0;
            server.to(room.roomId).emit('doorClicked', room.navigation.gameMap.tiles);
            const reachability = room.navigation.findReachableTiles(activePlayer, room);
            server.to(room.roomId).emit('reachableTiles', reachability);
            if (this.checkEndTurn(client, activePlayer)) {
                this.onTurnEnded(client, server);
            }
        }
    }

    async delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private checkAttack(room: Room, server: Server) {
        const activePlayer = this.getActivePlayer(room);
        if (room.navigation.checkAttack(activePlayer, room.listPlayers) && room.navigation.hasActionPoints(activePlayer)) {
            const targets = room.navigation.getNeighborPlayers(activePlayer, room.listPlayers);
            server.to(room.roomId).emit('attackAround', { attackAround: true, targets });
        } else {
            server.to(room.roomId).emit('attackAround', false);
        }
    }

    private checkDoors(room: Room, server: Server) {
        const activePlayer = this.getActivePlayer(room);
        if (room.navigation.checkDoor(activePlayer, room.listPlayers) && room.navigation.hasActionPoints(activePlayer)) {
            const targets = room.navigation.getNeighborDoors(activePlayer, room.listPlayers);
            server.to(room.roomId).emit('doorAround', { doorAround: true, targets });
        } else {
            server.to(room.roomId).emit('doorAround', false);
        }
    }

    private checkFell(): boolean {
        const randomValue = Math.random();
        return randomValue > FELLING_PROBABILITY;
    }

    private freeUpAvatar(room: Room, socket: Socket) {
        if (socket.data.clickedAvatar) {
            const previousAvatar = this.getAvatarByName(room, socket.data.clickedAvatar);
            if (previousAvatar) {
                previousAvatar.isTaken = false;
            }
        }
    }

    private generateUniquePlayerName(playerName: string, socket: Socket): string {
        let name = playerName;
        let suffix = 2;

        while (this.isPlayerNameTaken(name, socket)) {
            name = `${playerName}-${suffix}`;
            suffix++;
        }
        return name;
    }

    private getAvatarByName(room: Room, avatar: Avatar) {
        return room.availableAvatars.find((av) => av.name === avatar.name);
    }

    private getPlayerConnectedInRoom(room: Room) {
        return room.listPlayers.filter((player) => player.status !== Status.Disconnected);
    }

    private getCost(tileType: number): number {
        switch (tileType) {
            case TileType.Ground:
                return TileCost.Ground;
            case TileType.Water:
                return TileCost.Water;
            case TileType.Ice:
                return TileCost.Ice;
            case TileType.OpenDoor:
                return TileCost.OpenDoor;
            default:
                return Infinity;
        }
    }

    private isActivePlayer(socket: Socket) {
        const room = this.roomService.getRoom(socket);
        const currentPlayer = this.getPlayerById(room, socket);
        return currentPlayer.isActive;
    }

    private isLastPlayer(room: Room) {
        return this.getPlayerConnectedInRoom(room).length === SINGLE_PLAYER;
    }

    private isCodeFormatValid(roomCode: string): boolean {
        return /^[0-9]{4}$/.test(roomCode);
    }

    private isPlayerNameTaken(name: string, socket: Socket) {
        const playersList = this.roomService.getRoom(socket).listPlayers;
        return playersList.some((player) => player.name === name);
    }

    private playerDisconnected(room: Room, socket: Socket, server: Server) {
        const disconnectedPlayer = this.getPlayerById(room, socket);
        if (this.isActivePlayer(socket)) {
            this.onTurnEnded(socket, server);
        }
        disconnectedPlayer.status = Status.Disconnected;
        if (this.isLastPlayer(room)) {
            server.to(room.roomId).emit('draw');
        }
        server.to(room.roomId).emit('playerDisconnected', disconnectedPlayer);
        this.sortPlayersBySpeed(room);
    }

    private playerTurnTimer(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        this.roomService.getTurnTimer(room.roomId).resetTimer(TURN_TIME, (timeRemaining) => {
            server.to(room.roomId).emit('startedTurnTimer', timeRemaining);
            if (timeRemaining <= 0) {
                this.onTurnEnded(client, server);
            }
        });
    }

    private sendAvatarListToClient(socket: Socket) {
        const room = this.roomService.getRoom(socket);
        const customizedAvatarsList = room.availableAvatars.map((avatar) => {
            const isSelectedByClient = socket.data.clickedAvatar?.name === avatar.name;
            return {
                ...avatar,
                isTaken: !isSelectedByClient && avatar.isTaken,
                isSelected: isSelectedByClient,
            };
        });
        socket.emit('characterSelected', customizedAvatarsList);
    }

    private sortPlayersBySpeed(room: Room) {
        let listPlayers = room.listPlayers;
        if (listPlayers.length > 1) {
            listPlayers.sort((player1, player2) => player2.attributes.speed - player1.attributes.speed);
            listPlayers = [
                ...listPlayers.filter((player) => player.status !== Status.Disconnected),
                ...listPlayers.filter((player) => player.status === Status.Disconnected),
            ];
        }
        room.listPlayers = listPlayers;
    }

    private updateActivePlayer(socket: Socket) {
        const room = this.roomService.getRoom(socket);
        const listPlayers = this.getPlayerConnectedInRoom(room);
        const index = listPlayers.findIndex((item) => item.id === this.getActivePlayer(room).id);
        const nextIndex = (index + 1) % listPlayers.length;
        listPlayers[index].isActive = false;
        listPlayers[nextIndex].isActive = true;
    }
}
