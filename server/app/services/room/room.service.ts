import { ACCESS_CODE_LENGTH, MAX_ACCESS_CODE_VALUE } from '@app/constants';
import { Game } from '@common/game';
import { Room } from '@common/room';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
@Injectable()
export class RoomService {
    private io: Server;
    rooms = new Map<string, Room>();
    adminList: string[] = [];

    setServer(io: Server) {
        this.io = io;
    }

    createRoom(socket: Socket, game: Game): Room {
        const roomCode: string = this.getNewRoomCode();
        const room: Room = {
            gameMap: game,
            roomId: roomCode,
            listPlayers: [],
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
        this.rooms.delete(roomId);
        this.io.in(roomId).socketsLeave(roomId);
    }

    getRoomId(client: Socket) {
        const roomCode = client.data.roomCode;
        return this.isRoomActive(roomCode) ? roomCode : null;
    }

    joinRoom(socket: Socket, roomId: string) {
        const room = this.rooms.get(roomId);

        if (this.isRoomActive(roomId)) {
            socket.join(roomId);
            console.log(`client ${socket.id} joined room ${roomId}`);
            this.io.to(roomId).emit('joinedRoom', room);
        } else {
            this.io.emit('joinError');
        }
    }
}
