import { RoomService } from '@app/services/room/room.service';
import { Game } from '@common/game';
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
    handleCreateRoom(client: Socket, game: Game): void {
        const room = this.roomService.createRoom(client, game);
        client.emit('roomCreated', room);
        console.log(`Room ${room.roomId} created by admin ${client.id}`);
    }

    @SubscribeMessage(RoomEvents.JoinRoom)
    handleJoinRoom(client: Socket, roomId: string): void {
        console.log('server', this.roomService.rooms.keys(), roomId); // for debug
        this.roomService.joinRoom(client, roomId);
    }

    @SubscribeMessage(RoomEvents.LeaveRoom)
    handleLeaveRoom(client: Socket, room: string): void {
        this.roomService.leaveRoom(room, client);
        console.log(`client ${client.id} left room ${room}`);
        this.server.to(room).emit('message', `Client ${client.id} left room ${room}`);
    }
}
