import { ACCESS_CODE_LENGTH, MAX_ACCESS_CODE_VALUE } from '@app/constants';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class RoomService {
    private io: Server;
    roomCodes: string[] = [];
    adminList: string[] = [];

    setServer(io: Server) {
        this.io = io;
    }

    createRoom(socket: Socket): string {
        const roomCode: string = this.getNewRoomCode();
        this.roomCodes.push(roomCode);
        this.adminList.push(socket.id);
        socket.join(roomCode);
        socket.data.roomCode = roomCode;
        return roomCode;
    }

    isRoomActive(roomId: string): boolean {
        return this.roomCodes.includes(roomId);
    }

    isPlayerAdmin(socket: Socket) {
        return this.adminList.includes(socket.id);
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

    leaveRoom(roomId: string, socket: Socket) {
        if (!socket) {
            return;
        }
        if (this.isPlayerAdmin(socket)) {
            this.deleteRoom(roomId);
        } else {
            socket.leave(roomId);
            socket.data = {};
        }
    }

    leaveRoomById(roomId: string, socketId: string) {
        this.leaveRoom(roomId, this.io.sockets.sockets.get(socketId));
    }

    deleteRoom(roomId: string) {
        this.roomCodes = this.roomCodes.filter((code) => code !== roomId);
        this.io.in(roomId).socketsLeave(roomId);
    }

    getRoomId(client: Socket) {
        const roomCode = client.data.roomCode;
        return this.isRoomActive(roomCode) ? roomCode : null;
    }
}
