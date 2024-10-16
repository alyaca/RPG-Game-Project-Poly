import { RoomService } from '@app/services/room/room.service';
import { Game } from '@common/game';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomEvents } from './player-connection.events';

@WebSocketGateway({ cors: true })
@Injectable()
export class PlayerConnectionGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    private server: Server;

    constructor(
        private readonly roomService: RoomService,
        private readonly logger: Logger,
    ) {}

    @SubscribeMessage(RoomEvents.CreateRoom)
    handleCreateRoom(client: Socket, game: Game): void {
        const room = this.roomService.createRoom(client, game);
        client.emit('roomCreated', room);
        this.logger.log(`Room ${room.roomId} created by admin: ${client.id}`);
    }

    @SubscribeMessage(RoomEvents.JoinRoom)
    handleJoinRoom(client: Socket, roomId: string): void {
        this.roomService.joinRoom(client, roomId);
        this.logger.debug(`client ${client.id} try joined room ${roomId}`); // for debug
    }

    @SubscribeMessage(RoomEvents.LeaveRoom)
    handleLeaveRoom(client: Socket, room: string): void {
        this.logger.debug(`client ${client.id} left room ${room}`); // for debug
        const isAdmin = this.roomService.isPlayerAdmin(client);
        if (isAdmin) {
            client.emit('leftRoom', isAdmin);
            this.roomService.deleteRoom(room, client);
        } else {
            client.emit('leftRoom', isAdmin);
            this.roomService.leaveRoom(room, client);
        }
    }

    onModuleInit() {
        this.roomService.setServer(this.server);
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
}
