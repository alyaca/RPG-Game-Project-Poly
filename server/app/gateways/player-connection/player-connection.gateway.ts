import { RoomService } from '@app/services/room/room.service';
import { Injectable } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class PlayerConnection implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private server: Server;

    constructor(private readonly roomService: RoomService) {}

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('createRoom')
    handleCreateRoom(client: Socket): void {
        const roomCode = this.roomService.createRoom(client);
        client.emit('roomCreated', roomCode);
        console.log(`Room ${roomCode} created by admin ${client.id}`);
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(client: Socket, room: string): void {
        console.log('server', this.roomService.roomCodes, room);

        if (this.roomService.isRoomActive(room)) {
            client.join(room);
            console.log(`client ${client.id} joined room ${room}`);
            this.server.to(room).emit('joinedRoom', `Client ${client.id} joined room ${room}`);
        }
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(client: Socket, room: string): void {
        client.leave(room);
        console.log(`client ${client.id} left room ${room}`);
        this.server.to(room).emit('message', `Client ${client.id} left room ${room}`);
    }
}
