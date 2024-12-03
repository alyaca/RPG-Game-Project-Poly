import { Navigation } from '@app/classes/navigation/navigation';
import { Stopwatch } from '@app/classes/stopwatch/stopwatch';
import {
    DEFAULT_ACTION_POINT,
    DEFAULT_ATTRIBUTE,
    DISCONNECTED_POSITION,
    EQUAL_ODDS_PROBABILITY,
    FALLING_PROBABILITY,
    HIGH_ATTRIBUTE,
    LogType,
    MAX_ACTION_POINT,
    MOVEMENT_TIME,
    PLAYER_FELL_DELAY,
    SINGLE_PLAYER,
    STARTING_TIME,
    TURN_TIME,
} from '@app/constants';
import { InfoSwap } from '@app/interfaces/info-item-swap';
import { baseBot } from '@app/mocks/mock-players';
import { BotService } from '@app/services/bot/bot.service';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { MatchService } from '@app/services/match/match.service';
import { PlayerInventoryService } from '@app/services/player-inventory/player-inventory.service';
import { RoomService } from '@app/services/room/room.service';
import { ObjectType } from '@common/avatars-info';
import { GameMode, TileCost, TileType } from '@common/constants';
import { Avatar, Behavior, Player, Position, Status } from '@common/interfaces/player';
import { GameStatus, Room } from '@common/interfaces/room';
import { ActionData } from '@common/interfaces/socket-data.interface';
import { ServerToClientEvent } from '@common/socket.events';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/* eslint-disable max-lines */
@Injectable()
export class GameService {
    isMoving: boolean = false;
    isTurnSkipped: boolean = false;
    isPlayerFell: boolean = false;

    constructor(
        private roomService: RoomService,
        private playerInventoryService: PlayerInventoryService,
        private gameLogsService: GameLogsService,
        private matchService: MatchService,
        private botService: BotService,
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

    handleJoinGame(client: Socket, roomId: string) {
        const connectionRes = this.connectPlayerToGame(roomId);
        const room = this.roomService.rooms.get(roomId);
        this.roomService.joinRoom(client, roomId);
        if (connectionRes.errorType) {
            this.roomService.leaveRoom(roomId, client);
            client.emit(connectionRes.event, connectionRes.errorType);
        } else {
            client.emit(connectionRes.event, room);
        }
    }

    handleCreatePlayer(room: Room, player: Player, socket: Socket, server: Server) {
        const isAdmin = this.roomService.isPlayerAdmin(socket);
        const isBot = player.status === Status.Bot;
        if (!isBot) {
            player.id = socket.id;
            player.status = isAdmin ? Status.Admin : player.status;
        }
        this.setUniquePlayerName(player, socket, !isBot);
        room.listPlayers.push(player);
        const takenAvatar = this.getAvatarByName(room, player.avatar);
        takenAvatar.isTaken = true;
        server.to(room.roomId).emit(ServerToClientEvent.UpdatedPlayer, room);
        socket.emit(ServerToClientEvent.IsPlayerAdmin, isAdmin);
    }

    getActivePlayer(room: Room): Player {
        return room.listPlayers.find((player) => player.isActive);
    }

    getGame(roomId: string) {
        return this.roomService.rooms.get(roomId);
    }

    getPlayerById(room: Room, socket: Socket) {
        return room.listPlayers.find((player) => player.id === socket.id);
    }

    leavePlayerFromGame(roomId: string, socket: Socket, server: Server) {
        const isAdmin = this.roomService.isPlayerAdmin(socket);
        const room = this.roomService.getRoom(socket);
        socket.emit(ServerToClientEvent.LeftRoom, isAdmin);
        const player = this.getPlayerById(room, socket);
        this.gameLogsService.sendPlayerLog(roomId, server, player, LogType.GiveUp);

        if (isAdmin && room.isDebug) {
            room.isDebug = false;
            server.to(roomId).emit(ServerToClientEvent.DebugMode, false);
        }
        if (isAdmin && room.gameStatus === GameStatus.Lobby) {
            this.roomService.deleteRoom(roomId, socket);
        } else if (room.gameStatus === GameStatus.Started) {
            this.placeItemsOnGround(room, server, player);
            this.playerDisconnected(room, socket, server);
            socket.to(roomId).emit(ServerToClientEvent.PlayerDisconnected, room.listPlayers);
            const activePlayer = this.getActivePlayer(room);
            player.position = DISCONNECTED_POSITION;
            if (activePlayer.id !== player.id) {
                const reachability = room.navigation.findReachableTiles(activePlayer, room);
                server.to(room.roomId).emit(ServerToClientEvent.ReachableTiles, reachability);
            }
        } else {
            this.removePlayerFromRoom(roomId, socket, server);
            socket.to(roomId).emit(ServerToClientEvent.UpdatedPlayer, room);
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
        server.to(room.roomId).emit(ServerToClientEvent.StartGame, room);
        server.to(room.roomId).emit(ServerToClientEvent.MapInformation, room);
        server.to(room.roomId).emit(ServerToClientEvent.ActivePlayer, activePlayer);
        const reachability = room.navigation.findReachableTiles(activePlayer, room);
        server.to(room.roomId).emit(ServerToClientEvent.ReachableTiles, reachability);
        this.checkActions(room, server);
    }

    onStartTurn(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const activePlayer = this.getActivePlayer(room);

        server.to(room.roomId).emit(ServerToClientEvent.OtherPlayerTurn, activePlayer.name);
        this.gameLogsService.sendPlayerLog(room.roomId, server, activePlayer, LogType.StartTurn);

        this.roomService.getTurnTimer(room.roomId).startTimer(STARTING_TIME, (timeRemaining) => {
            server.to(activePlayer.id).emit(ServerToClientEvent.BeforeStartTurnTimer, timeRemaining);
            if (timeRemaining <= 0) {
                this.playerTurnTimer(room, server);
            }
        });
        if (activePlayer.status === Status.Bot) {
            this.botService.processBotTurn(room, server, activePlayer);
            return;
        }
    }

    onTurnEnded(room: Room, server: Server) {
        if (!this.isMoving) {
            room.globalPostGameStats.turns++;
            this.updateActivePlayer(server, room);
            const activePlayer = this.getActivePlayer(room);
            activePlayer.attributes.movementPointsLeft = activePlayer.attributes.speed;
            server.to(room.roomId).emit(ServerToClientEvent.Reachability, activePlayer);
            server.to(room.roomId).emit(ServerToClientEvent.ActivePlayer, activePlayer);

            const host = room.listPlayers.find((player) => player.status === Status.Player || player.status === Status.Admin);
            if (!host) return;
            server.to(host.id).emit(ServerToClientEvent.TurnEnded);
            server.to(room.roomId).emit(ServerToClientEvent.UpdateVisual, room.listPlayers);

            room.navigation.isBot = activePlayer.status === Status.Bot;

            const reachability = room.navigation.findReachableTiles(activePlayer, room);
            server.to(room.roomId).emit(ServerToClientEvent.ReachableTiles, reachability);
            this.checkActions(room, server);
        } else {
            this.isTurnSkipped = true;
        }
    }

    assignStatsToBot(bot: Player): Player {
        bot.attributes.currentHp = Math.random() > EQUAL_ODDS_PROBABILITY ? HIGH_ATTRIBUTE : DEFAULT_ATTRIBUTE;
        bot.attributes.speed = bot.attributes.currentHp === HIGH_ATTRIBUTE ? DEFAULT_ATTRIBUTE : HIGH_ATTRIBUTE;

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
        newBot.collectedItems = [];
        this.handleCreatePlayer(room, newBot, client, server);
        this.updateAvatarsForAllClients(server, room.roomId);
        server.to(room.roomId).emit(ServerToClientEvent.UpdatedPlayer, room);
    }

    onKickBot(socket: Socket, botId: string, server: Server) {
        const room = this.roomService.getRoom(socket);
        server.to(botId).emit(ServerToClientEvent.KickPlayer, botId);
        const botPlayer = room.listPlayers.find((player) => player.id === botId);
        botPlayer.avatar.isTaken = false;
        room.listPlayers = room.listPlayers.filter((player) => player.id !== botId);
        server.to(room.roomId).emit(ServerToClientEvent.UpdatedPlayer, room);
        this.updateAvatarsForAllClients(server, room.roomId);
    }

    onKickPlayer(socket: Socket, server: Server, playerId: string) {
        const room = this.roomService.getRoom(socket);
        server.to(playerId).emit(ServerToClientEvent.KickPlayer, playerId);
        const playerSocket = server.sockets.sockets.get(playerId);
        this.removePlayerFromRoom(room.roomId, playerSocket, server);
        server.to(room.roomId).emit(ServerToClientEvent.UpdatedPlayer, room);
    }

    handleDebugMode(isDebugMode: boolean, server: Server, client: Socket) {
        const room = this.roomService.getRoom(client);
        room.isDebug = isDebugMode;
        this.gameLogsService.sendDebugLog(isDebugMode, room.roomId, server);
        server.to(room.roomId).emit(ServerToClientEvent.DebugMode, isDebugMode);
    }

    processTeleportation(room: Room, server: Server, position: Position) {
        const player = this.getActivePlayer(room);
        const playerId = player.id;
        if (room.navigation.isTileValid(position.x, position.y)) {
            player.position = position;
            server.to(room.roomId).emit(ServerToClientEvent.TeleportPlayer, { position, playerId });
        }
        const reachability = room.navigation.findReachableTiles(player, room);
        server.to(room.roomId).emit(ServerToClientEvent.EndMovement);
        server.to(room.roomId).emit(ServerToClientEvent.ReachableTiles, reachability);
        this.checkActions(room, server);
    }

    startItemSwap(infoSwap: InfoSwap) {
        const room = this.roomService.getRoom(infoSwap.client);
        let activePlayer = this.getActivePlayer(room);
        activePlayer = this.playerInventoryService.updatePlayerAfterSwap(infoSwap);

        this.roomService.getTurnTimer(room.roomId).resumeTimer((timeLeft) => {
            if (timeLeft <= 0) {
                this.onTurnEnded(room, infoSwap.server);
            }
            infoSwap.server.to(room.roomId).emit(ServerToClientEvent.StartedTurnTimer, timeLeft);
        });
        infoSwap.client.emit(ServerToClientEvent.UpdatedInventory, activePlayer);
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
        this.isPlayerFell = false;
        let pickedUpItem = false;
        const player = this.getActivePlayer(room);
        this.initTileHistory(room);
        for (const tile of path) {
            this.isMoving = true;
            player.position = tile;
            pickedUpItem = false;
            if (this.isNotAvatar(room, tile) && this.isObject(room, tile)) {
                const infoSwap: InfoSwap = {
                    server,
                    client,
                    player,
                };
                pickedUpItem = true;
                this.playerInventoryService.updateInventory(infoSwap, room.gameMap.itemPlacement);
                server.to(room.roomId).emit(ServerToClientEvent.UpdateObjects, room.gameMap.itemPlacement);
            }
            this.addUniqueTileToHistory(player.positionHistory, tile);
            this.addUniqueTileToHistory(room.globalPostGameStats.globalTilesVisited, tile);

            if (room.gameMap.mode === GameMode.CaptureTheFlag) {
                this.checkFlagModeEndGame(player, room, server);
            }

            if (this.isMoving) {
                await this.delay(MOVEMENT_TIME);
            }
            server.to(room.roomId).emit(ServerToClientEvent.PlayerNavigation, tile);
            if (!room.isDebug && this.isTileIce(room, tile) && !this.checkFell()) {
                this.handleFallingOnIce(room, client, server);
                this.isPlayerFell = true;
                this.isMoving = false;
                break;
            }
            player.attributes.movementPointsLeft -= this.getCost(room.gameMap.tiles[tile.x][tile.y], player);
            if (pickedUpItem) break;
        }

        this.isMoving = false;
        const reachability = room.navigation.findReachableTiles(player, room);
        server.to(room.roomId).emit(ServerToClientEvent.EndMovement);
        server.to(room.roomId).emit(ServerToClientEvent.ReachableTiles, reachability);
        if (this.checkEndTurn(client, player)) {
            this.onTurnEnded(room, server);
            return;
        }
        if (this.isTurnSkipped && !this.isPlayerFell) {
            this.onTurnEnded(room, server);
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
        server.to(room.roomId).emit(ServerToClientEvent.EndGame, { winner, room });
        this.resetGlobalStats(room);
        this.stopGameTimers(room);
    }

    handleDoor(client: Socket, server: Server, doorActionData: ActionData) {
        const { clickedPosition, player } = doorActionData;
        const room = this.roomService.getRoom(client);
        const activePlayer = this.getActivePlayer(room);

        if (room.navigation.hasHandleDoorAction(clickedPosition.x, clickedPosition.y, player)) {
            this.addUniqueTileToHistory(room.globalPostGameStats.doorsInteracted, clickedPosition);
            this.gameLogsService.sendDoorLog(room.gameMap.tiles[clickedPosition.x][clickedPosition.y], activePlayer, room.roomId, server);
            activePlayer.attributes.actionPoints--;
            server.to(room.roomId).emit(ServerToClientEvent.DoorClicked, room.navigation.gameMap.tiles);
            const reachability = room.navigation.findReachableTiles(activePlayer, room);
            server.to(room.roomId).emit(ServerToClientEvent.ReachableTiles, reachability);
            if (this.checkEndTurn(client, activePlayer)) {
                this.onTurnEnded(room, server);
            }
        }
    }

    addActionPoints(player: Player) {
        if (player.inventory.find((items) => items.id === ObjectType.Trident)) {
            this.updateTridentEffect(player);
        } else {
            player.attributes.actionPoints = DEFAULT_ACTION_POINT;
        }
    }

    placeItemsOnGround(room: Room, server: Server, player: Player) {
        const playerToDropItems = room.listPlayers.find((p) => p.id === player.id);
        if (playerToDropItems.inventory.length === 0) return;

        for (const items of playerToDropItems.inventory) {
            const position = room.navigation.findClosestValidTile(playerToDropItems, room);
            this.playerInventoryService.removeItemEffects(playerToDropItems, items.id);
            room.gameMap.itemPlacement[position.x][position.y] = items.id;
            server.to(room.roomId).emit(ServerToClientEvent.UpdateObjectsAfterCombat, { newGrid: room.gameMap.itemPlacement, position });
        }
        playerToDropItems.inventory = [];
        server.to(playerToDropItems.id).emit(ServerToClientEvent.UpdatedInventory, playerToDropItems);
    }

    playerInWall(room: Room, player: Player) {
        return room.gameMap.tiles[player.position.x][player.position.y] === TileType.Wall;
    }

    async delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private updateTridentEffect(player: Player) {
        if (player.attributes.actionPoints === DEFAULT_ACTION_POINT) {
            player.attributes.maxActionPoints = MAX_ACTION_POINT;
            player.attributes.actionPoints += DEFAULT_ACTION_POINT;
        } else {
            player.attributes.actionPoints = DEFAULT_ACTION_POINT;
        }
    }

    private async handleFallingOnIce(room: Room, client: Socket, server: Server) {
        if (!room.navigation.isBot) {
            this.stopGameTimers(room);
            client.emit(ServerToClientEvent.PlayerFell);
        } else {
            await this.delay(PLAYER_FELL_DELAY);
            this.onTurnEnded(room, server);
        }
    }

    private isTileIce(room: Room, tile: Position) {
        return room.gameMap.tiles[tile.x][tile.y] === TileType.Ice;
    }

    private isObject(room: Room, tile: Position) {
        return room.gameMap.itemPlacement[tile.x][tile.y] <= ObjectType.Random || this.isOjectFlag(room, tile);
    }

    private isOjectFlag(room: Room, tile: Position) {
        return room.gameMap.itemPlacement[tile.x][tile.y] === ObjectType.Flag;
    }

    private isNotAvatar(room: Room, tile: Position) {
        return room.gameMap.itemPlacement[tile.x][tile.y] >= ObjectType.Trident;
    }

    private checkFlagModeEndGame(player: Player, room: Room, server: Server) {
        const hasPlayerFlag = player.inventory.find((object) => object.id === ObjectType.Flag);
        const isPlayerOnSpawn = player.position.x === player.spawnPosition.x && player.position.y === player.spawnPosition.y;
        if (isPlayerOnSpawn && hasPlayerFlag) {
            this.onEndGame(player, room, server);
            this.gameLogsService.sendEndGameLog(room.listPlayers, room.roomId, server);
        }
    }

    private checkAttack(room: Room, server: Server) {
        const activePlayer = this.getActivePlayer(room);
        if (room.navigation.checkAttack(activePlayer, room.listPlayers) && room.navigation.hasActionPoints(activePlayer)) {
            const targets = room.navigation.getNeighborPlayers(activePlayer, room.listPlayers);
            server.to(room.roomId).emit(ServerToClientEvent.AttackAround, { attackAround: true, targets });
        } else {
            server.to(room.roomId).emit(ServerToClientEvent.AttackAround, false);
        }
    }

    private checkDoors(room: Room, server: Server) {
        const activePlayer = this.getActivePlayer(room);
        if (room.navigation.checkDoor(activePlayer, room.listPlayers) && room.navigation.hasActionPoints(activePlayer)) {
            const targets = room.navigation.getNeighborDoors(activePlayer, room.listPlayers);
            server.to(room.roomId).emit(ServerToClientEvent.DoorAround, { doorAround: true, targets });
        } else {
            server.to(room.roomId).emit(ServerToClientEvent.DoorAround, false);
        }
    }

    private freeUpAvatar(room: Room, socket: Socket) {
        if (socket.data.clickedAvatar) {
            const previousAvatar = this.getAvatarByName(room, socket.data.clickedAvatar);
            if (previousAvatar) {
                previousAvatar.isTaken = false;
            }
        }
    }

    private getCost(tileType: number, activePlayer: Player): number {
        switch (tileType) {
            case TileType.Ground:
                return TileCost.Ground;
            case TileType.Water:
                return TileCost.Water;
            case TileType.Ice:
                return TileCost.Ice;
            case TileType.OpenDoor:
                return TileCost.OpenDoor;
            case TileType.Wall:
                if (activePlayer.inventory.find((objects) => objects.id === ObjectType.Kunee)) {
                    return TileCost.Ground;
                }
                return Infinity;
            default:
                return Infinity;
        }
    }

    private checkFell(): boolean {
        const randomValue = Math.random();
        return randomValue > FALLING_PROBABILITY;
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
            disconnectedPlayer.status = Status.PendingDisconnection;
            this.onTurnEnded(room, server);
        }
        disconnectedPlayer.status = Status.Disconnected;

        if (this.isLastPlayer(room)) {
            server.to(room.roomId).emit(ServerToClientEvent.DrawGame);
        }
        server.to(room.roomId).emit(ServerToClientEvent.PlayerDisconnected, disconnectedPlayer);
        this.sortPlayersBySpeed(room);
    }

    private playerTurnTimer(room: Room, server: Server) {
        this.roomService.getTurnTimer(room.roomId).resetTimer(TURN_TIME, (timeRemaining) => {
            server.to(room.roomId).emit(ServerToClientEvent.StartedTurnTimer, timeRemaining);
            if (timeRemaining <= 0) {
                this.onTurnEnded(room, server);
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
        socket.emit(ServerToClientEvent.CharacterSelected, customizedAvatarsList);
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

    private updateActivePlayer(server: Server, room: Room) {
        const listPlayers = this.getPlayerConnectedInRoom(room);
        const index = listPlayers.findIndex((item) => item.id === this.getActivePlayer(room).id);
        const previousActivePlayer = listPlayers[index];
        this.addActionPoints(previousActivePlayer);

        if (this.playerInWall(room, previousActivePlayer)) {
            this.removePlayerFromWall(server, room, previousActivePlayer);
        }
        listPlayers[index] = previousActivePlayer;
        const nextIndex = (index + 1) % listPlayers.length;
        listPlayers[index].isActive = false;
        listPlayers[nextIndex].isActive = true;
    }

    private removePlayerFromWall(server: Server, room: Room, previousActivePlayer: Player) {
        room.gameMap.itemPlacement[previousActivePlayer.position.x][previousActivePlayer.position.y] = 0;
        server.to(room.roomId).emit(ServerToClientEvent.UpdateObjectsAfterCombat, {
            newGrid: room.gameMap.itemPlacement,
            position: { x: previousActivePlayer.position.x, y: previousActivePlayer.position.y },
        });

        const destination = room.navigation.movePlayerFromWall(room, previousActivePlayer);
        room.navigation.findFastestPath(previousActivePlayer, destination, room);

        previousActivePlayer.position = destination;
        room.gameMap.itemPlacement[previousActivePlayer.position.x][previousActivePlayer.position.y] = previousActivePlayer.avatar.id;
        this.processTeleportation(room, server, previousActivePlayer.position);
        server.to(room.roomId).emit(ServerToClientEvent.UpdateObjectsAfterCombat, {
            newGrid: room.gameMap.itemPlacement,
            position: previousActivePlayer.position,
        });
    }
}
