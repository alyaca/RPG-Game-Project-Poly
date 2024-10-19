import { ACCESS_CODE_LENGTH, MAX_ACCESS_CODE_VALUE } from '@app/constants';
import { avatars } from '@common/avatarsInfo';
import { Game } from '@common/game';
import { Room } from '@common/room';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
@Injectable()
export class RoomService {
    rooms = new Map<string, Room>();
    adminList: string[] = [];
    private io: Server;

    setServer(io: Server) {
        this.io = io;
        console.log('Server has been initialized');
    }

    getServer(): Server {
        if (!this.io) {
            throw new Error('Server is not initialized');
        }
        return this.io;
    }

    createRoom(socket: Socket, game: Game): Room {
        const roomCode: string = this.getNewRoomCode();
        const room: Room = {
            gameMap: game,
            roomId: roomCode,
            listPlayers: [],
            availableAvatars: avatars.map((avatar) => ({ ...avatar, isTaken: false })),
            adminId: socket.id,
            isLocked: false,
        };
        this.rooms.set(roomCode, room);
        this.adminList.push(socket.id);
        socket.join(roomCode);
        socket.data.roomCode = roomCode;
        return room;
    }

    isRoomActive(roomId: string): boolean {
        return this.rooms.has(roomId);
    }

    isPlayerAdmin(socket: Socket) {
        return this.adminList.includes(socket.id);
    }

    leaveRoom(roomId: string, socket: Socket) {
        if (!socket) {
            return;
        }
        socket.leave(roomId);
        socket.data = {};
    }

    deleteRoom(roomId: string, socket: Socket) {
        socket.broadcast.to(roomId).emit('roomDeleted', 'La partie a été annulée. Vous serez redirigés vers le menu principal.');
        this.rooms.delete(roomId);
        this.io.in(roomId).socketsLeave(roomId);
    }

    getRoomId(client: Socket) {
        const roomCode = client.data.roomCode;
        return this.isRoomActive(roomCode) ? roomCode : null;
    }

    getRoom(client: Socket) {
        const roomCode = this.getRoomId(client);
        return this.rooms.get(roomCode);
    }

    joinRoom(socket: Socket, roomId: string) {
        if (!this.isRoomActive(roomId)) {
            return;
        }
        socket.join(roomId);
        socket.data.roomCode = roomId;
    }

    private generateRoomCode(): string {
        const code = Math.floor(Math.random() * MAX_ACCESS_CODE_VALUE);
        return code.toString().padStart(ACCESS_CODE_LENGTH, '0');
    }

    private getNewRoomCode(): string {
        let roomCode = this.generateRoomCode();
        while (this.isRoomActive(roomCode)) {
            roomCode = this.generateRoomCode();
        }
        return roomCode;
    }
}
