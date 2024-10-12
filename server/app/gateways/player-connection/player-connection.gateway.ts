import { RoomService } from '@app/services/room/room.service';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomEvents } from './player-connection.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class PlayerConnection implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    private server: Server;

    constructor(private readonly roomService: RoomService) {}

    onModuleInit() {
        this.roomService.setServer(this.server);
    }

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage(RoomEvents.CreateRoom)
    handleCreateRoom(client: Socket): void {
        const roomCode = this.roomService.createRoom(client);
        client.emit('roomCreated', roomCode);
        console.log(`Room ${roomCode} created by admin ${client.id}`);
    }

    @SubscribeMessage(RoomEvents.JoinRoom)
    handleJoinRoom(client: Socket, room: string): void {
        console.log('server', this.roomService.roomCodes, room); // for debug

        if (this.roomService.isRoomActive(room)) {
            client.join(room);
            console.log(`client ${client.id} joined room ${room}`);
            this.server.to(room).emit('joinedRoom', `Client ${client.id} joined room ${room}`);
        } else {
            this.server.emit('joinError');
        }
    }

    @SubscribeMessage(RoomEvents.LeaveRoom)
    handleLeaveRoom(client: Socket, room: string): void {
        this.roomService.leaveRoom(room, client);
        console.log(`client ${client.id} left room ${room}`);
        this.server.to(room).emit('message', `Client ${client.id} left room ${room}`);
    }
}
