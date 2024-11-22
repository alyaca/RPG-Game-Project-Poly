import { FELLING_PROBABILITY, MOVEMENT_TIME, SINGLE_PLAYER, STARTING_TIME, TileCost, TileType, TURN_TIME } from '@app/constants';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { MatchService } from '@app/services/match/match.service';
import { RoomService } from '@app/services/room/room.service';
import { Avatar, Player, Position, PostGameStats, Status } from '@common/player';
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
        player.id = socket.id;
        this.setUniquePlayerName(player, socket);
        if (this.roomService.isPlayerAdmin(socket)) {
            player.status = Status.Admin;
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
        if (isAdmin && room.gameStatus === GameStatus.Lobby) {
            this.roomService.deleteRoom(roomId, socket);
        } else if (room.gameStatus === GameStatus.Started) {
            this.playerDisconnected(room, socket, server);
            socket.to(roomId).emit('disconnectedPlayer', room.listPlayers);
            const activePlayer = this.getActivePlayer(room);
            const reachability = room.navigation.findReachableTiles(activePlayer, room.gameMap);
            server.to(room.roomId).emit('reachableTiles', reachability);
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

    onStartGame(room: Room, socket: Socket) {
        this.matchService.processMapObjects(socket);
        room.gameStatus = GameStatus.Started;
        this.sortPlayersBySpeed(room);
        room.listPlayers[0].isActive = true;
    }

    onStartTurn(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const activePlayer = this.getActivePlayer(room);
        
        server.to(room.roomId).emit('otherPlayerTurn', activePlayer.name);
        this.gameLogsService.sendTurnLog(activePlayer, room.roomId, server);

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
            activePlayer.attributes.movementPointsLeft = activePlayer.attributes.speed;
            server.to(room.roomId).emit('reachability', activePlayer);
            server.to(room.roomId).emit('isActive', activePlayer);
            server.to(room.roomId).emit('turnEnded', room.listPlayers);
            const reachability = room.navigation.findReachableTiles(activePlayer, room.gameMap);
            server.to(room.roomId).emit('reachableTiles', reachability);
            this.checkDoors(room, server);
            this.checkAttack(room, server);
        } else {
            this.isTurnSkipped = true;
        }
    }

    async processNavigation(room: Room, server: Server, path: Position[], client: Socket) {
        // TODO : refactor this
        const player = this.getActivePlayer(room);
        for (const tile of path) {
            this.isMoving = true;
            player.position = tile;
            if (this.isMoving) {
                await this.delay(MOVEMENT_TIME);
            }
            server.to(room.roomId).emit('playerNavigation', tile);
            if (room.gameMap.tiles[tile.x][tile.y] === TileType.Ice && !this.checkFell()) {
                this.stopGameTimers(room);
                client.emit('playerFell');
                break;
            }
            if (room.gameMap.tiles[tile.x][tile.y] !== TileType.Ice) {
                player.attributes.movementPointsLeft -= this.getCost(room.gameMap.tiles[tile.x][tile.y]);
            }
        }
        this.isMoving = false;
        const reachability = room.navigation.findReachableTiles(player, room.gameMap);
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
        this.checkDoors(room, server);
        this.checkAttack(room, server);
    }

    checkDoors(room: Room, server: Server) {
        const activePlayer = this.getActivePlayer(room);
        if (room.navigation.checkDoor(activePlayer, room.listPlayers) && activePlayer.attributes.actionPoints > 0) {
            server.to(room.roomId).emit('doorAround', true);
        } else {
            server.to(room.roomId).emit('doorAround', false);
        }
    }

    checkAttack(room: Room, server: Server) {
        const activePlayer = this.getActivePlayer(room);
        if (room.navigation.checkAttack(activePlayer, room.listPlayers) && activePlayer.attributes.actionPoints > 0) {
            server.to(room.roomId).emit('attackAround', true);
        } else {
            server.to(room.roomId).emit('attackAround', false);
        }
    }

    checkEndTurn(client: Socket, activePlayer: Player): boolean {
        if (!activePlayer || !this.isActivePlayer) return;
        const room = this.roomService.getRoom(client);
        const reachableTileCount = room.navigation.findReachableTiles(activePlayer, room.gameMap).length;
        const players = room.listPlayers;

        // Player has movement point left, no action left.
        // Player is blocked by closed door or players.
        if (!room.navigation.haveActions(activePlayer, players) && reachableTileCount === 0) {
            return true;
        }

        // Player has no movement point left. Player has action point left but
        // no valid target on adjacent tiles.
        else if (activePlayer.attributes.movementPointsLeft === 0 && !room.navigation.haveActions(activePlayer, players)) {
            return true;
        }

        // Player has no movement point or action left.
        else if (activePlayer.attributes.movementPointsLeft === 0 && !room.navigation.hasActionPoints(activePlayer)) {
            return true;
        }
        return false;
    }

    async delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
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

    private setUniquePlayerName(player: Player, socket: Socket) {
        const playerName = this.generateUniquePlayerName(player.name, socket);
        player.name = playerName;
        socket.data.username = player.name;
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

    private updateAvatarsForAllClients(server: Server, roomId: string) {
        server.sockets.sockets.forEach((clientSocket: Socket) => {
            if (clientSocket.rooms.has(roomId)) {
                this.sendAvatarListToClient(clientSocket);
            }
        });
    }
}
