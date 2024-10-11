import { ACCESS_CODE_LENGTH, MAX_ACCESS_CODE_VALUE } from '@app/constants';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class RoomService {
    private io: Server;
    roomCodes: string[] = [];

    setServer(io: Server) {
        this.io = io;
    }

    createRoom(socket: Socket): string {
        const roomCode: string = this.getNewRoomCode();
        this.roomCodes.push(roomCode);
        socket.join(roomCode);
        socket.data.roomCode = roomCode;

        return roomCode;
    }

    isRoomActive(roomId: string): boolean {
        return this.roomCodes.includes(roomId);
    }

    private generateRoomCode(): string {
        const code = Math.floor(Math.random() * MAX_ACCESS_CODE_VALUE);
        return code.toString().padStart(ACCESS_CODE_LENGTH, '0');
    }

    // generate unique code for the room
    private getNewRoomCode(): string {
        let roomCode = this.generateRoomCode();
        while (this.isRoomActive(roomCode)) {
            roomCode = this.generateRoomCode();
        }
        return roomCode;
    }
}
