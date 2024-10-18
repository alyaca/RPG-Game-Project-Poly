import { RoomService } from '@app/services/room/room.service';
import { Avatar, Player } from '@common/player';
import { Room } from '@common/room';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class GameService {
    constructor(private roomService: RoomService) {}

    toggleLockRoom(roomId: string, isLocked: boolean) {
        const game = this.getGame(roomId);
        game.isLocked = isLocked;
    }

    getGame(roomId) {
        return this.roomService.rooms.get(roomId);
    }

    connectPlayerToGame(roomId: string) {
        const game = this.getGame(roomId);
        if (!this.roomService.isRoomActive(roomId)) {
            return { event: 'joinError', errorType: 'roomNotFound' };
        }
        if (game.isLocked) {
            return { event: 'joinError', errorType: 'roomLocked' };
        }
        return { event: 'joinedRoom' };
    }

    createPlayer(room: Room, player: Player, socket: Socket) {
        socket.data.username = player.name;
        room.listPlayers.push(player);
        const takenAvatar = this.getAvatarByName(room, player.avatar);
        takenAvatar.isTaken = true;
    }

    leavePlayerFromGame(roomId: string, socket: Socket) {
        const isAdmin = this.roomService.isPlayerAdmin(socket);
        const room = this.roomService.getRoom(socket);
        socket.emit('leftRoom', isAdmin);
        if (isAdmin) {
            this.roomService.deleteRoom(roomId, socket);
        } else {
            this.removePlayerFromRoom(roomId, socket);
            socket.to(roomId).emit('updatedPlayer', room);
        }
    }

    removePlayerFromRoom(roomId: string, socket: Socket) {
        const room = this.roomService.rooms.get(roomId);
        room.listPlayers = room.listPlayers.filter((player) => player.id !== socket.id);
        this.freeUpAvatar(room, socket);
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
            this.updateAvatarsForAllClients(server);
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

    private updateAvatarsForAllClients(server: Server) {
        server.sockets.sockets.forEach((clientSocket: Socket) => {
            this.sendAvatarListToClient(clientSocket);
        });
    }
}
