import { RoomService } from '@app/services/room/room.service';
import { Avatar, Player, Status } from '@common/player';
import { Room } from '@common/room';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class GameService {
    constructor(
        private roomService: RoomService,
        private logger: Logger,
    ) {}

    toggleLockRoom(roomId: string, isLocked: boolean) {
        const game = this.getGame(roomId);
        game.isLocked = isLocked;
    }

    getGame(roomId) {
        return this.roomService.rooms.get(roomId);
    }

    isCodeFormatValid(roomCode: string): boolean {
        return /^[0-9]{4}$/.test(roomCode);
    }

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

    setUniquePlayerName(player: Player, socket: Socket) {
        const playerName = this.generateUniquePlayerName(player.name, socket);
        player.name = playerName;
        socket.data.username = player.name;
    }

    leavePlayerFromGame(roomId: string, socket: Socket, server: Server) {
        const isAdmin = this.roomService.isPlayerAdmin(socket);
        const room = this.roomService.getRoom(socket);
        socket.emit('leftRoom', isAdmin);
        if (isAdmin) {
            this.roomService.deleteRoom(roomId, socket);
            this.logger.debug(`admin: ${socket.id} left room ${roomId}`); //for debug
        } else {
            this.removePlayerFromRoom(roomId, socket, server);
            socket.to(roomId).emit('updatedPlayer', room);
        }
    }

    //appeler cette fonction
    removePlayerFromRoom(roomId: string, socket: Socket, server: Server) {
        const room = this.roomService.rooms.get(roomId);
        room.listPlayers = room.listPlayers.filter((player) => player.id !== socket.id);
        this.freeUpAvatar(room, socket);
        this.updateAvatarsForAllClients(server, roomId);
        this.roomService.leaveRoom(roomId, socket);
    }

    getAvatarByName(room: Room, avatar: Avatar) {
        return room.availableAvatars.find((av) => av.name === avatar.name);
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

    freeUpAvatar(room: Room, socket: Socket) {
        if (socket.data.clickedAvatar) {
            const previousAvatar = this.getAvatarByName(room, socket.data.clickedAvatar);
            if (previousAvatar) {
                previousAvatar.isTaken = false;
            }
        }
    }

    updateAvatarsForAllClients(server: Server, roomId: string) {
        server.sockets.sockets.forEach((clientSocket: Socket) => {
            if (clientSocket.rooms.has(roomId)) {
                this.sendAvatarListToClient(clientSocket);
            }
        });
    }

    //ICI
    sendAvatarListToClient(socket: Socket) {
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

    isPlayerNameTaken(name: string, socket: Socket) {
        const playersList = this.roomService.getRoom(socket).listPlayers;
        return playersList.some((player) => player.name === name);
    }

    generateUniquePlayerName(playerName: string, socket: Socket): string {
        let name = playerName;
        let suffix = 2;

        while (this.isPlayerNameTaken(name, socket)) {
            name = `${playerName}-${suffix}`;
            suffix++;
        }
        return name;
    }
}
