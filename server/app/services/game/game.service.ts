import { FIGHT_TIME, MOVEMENT_TIME, STARTING_TIME, TURN_TIME } from '@app/constants';
import { RoomService } from '@app/services/room/room.service';
import { Avatar, Player, Position, Status } from '@common/player';
import { GameStatus, Room } from '@common/room';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class GameService {
    constructor(private roomService: RoomService) {}

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
        if (isAdmin) {
            this.roomService.deleteRoom(roomId, socket);
        } else if (room.gameStatus === GameStatus.Started) {
            this.playerDisconnected(room, socket, server);
            socket.to(roomId).emit('disconnectedPlayer', room.listPlayers);
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

    stopGameTimers(server: Server, roomId: string) {
        if (!server.sockets.adapter.rooms.get(roomId)) {
            this.roomService.getFightTimer(roomId).stopTimer();
            this.roomService.getTurnTimer(roomId).stopTimer();
        }
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

    onStartGame(room: Room) {
        room.gameStatus = GameStatus.Started;
        this.sortPlayersBySpeed(room);
        room.listPlayers[0].isActive = true;
    }

    onStartTurn(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const activePlayer = this.getActivePlayer(room);
        client.to(room.roomId).emit('otherPlayerTurn', client.data.username);
        this.roomService.getTurnTimer(room.roomId).startTimer(STARTING_TIME, (timeRemaining) => {
            server.to(activePlayer.id).emit('beforeStartTurnTimer', timeRemaining);
            if (timeRemaining === 0) {
                this.playerTurnTimer(client, server);
            }
        });
    }

    onTurnEnded(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        this.updateActivePlayer(client);
        const activePlayer = this.getActivePlayer(room);
        server.to(room.roomId).emit('isActive', activePlayer.id);
        server.to(room.roomId).emit('turnEnded', room.listPlayers);
    }

    // To do for fight
    onStartFight(client: Socket, opponent: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        this.roomService.getTurnTimer(room.roomId).pauseTimer();
        this.roomService.getFightTimer(room.roomId).startTimer(FIGHT_TIME, (timeRemaining) => {
            client.emit('fightTime', timeRemaining);
            server.to(opponent.id).emit('fightTime', timeRemaining);
        });
    }

    // To do for fight
    onEndFight(server: Server, room: Room) {
        this.roomService.getTurnTimer(room.roomId).resumeTimer((timeRemaining) => {
            server.to(room.roomId).emit('startedTurnTimer', timeRemaining);
        });
    }

    async proccesNavigation(room: Room, server: Server, path: Position[]) {
        // const playersList = this.roomService.getRoom(socket).listPlayers;
        for (const tile of path) {
            this.getActivePlayer(room).position = tile;
            // socket.emit('playerNavigation', this.getActivePlayer(room), tile);
            await this.delay(MOVEMENT_TIME); // CONSTANT A ENLEVER
            // socket.emit('playerNavigation', tile);
            server.to(room.roomId).emit('playerNavigation', tile);
        }
    }

    async delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
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
        // TODO: remove player avatar from grid
        this.sortPlayersBySpeed(room);
    }

    private playerTurnTimer(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        this.roomService.getTurnTimer(room.roomId).resetTimer(TURN_TIME, (timeRemaining) => {
            server.to(room.roomId).emit('startedTurnTimer', timeRemaining);
            if (timeRemaining === 0) {
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
        const index = listPlayers.findIndex((item) => item.id === socket.id);
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
