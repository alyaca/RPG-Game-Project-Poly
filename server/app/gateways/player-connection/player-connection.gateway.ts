import { Injectable } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class PlayerConnection implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    private server: Server;

    handleConnection(player: Socket) {
        console.log(`Player connected: ${player.id}`);
    }

    handleDisconnect(player: Socket) {
        console.log(`Player disconnected: ${player.id}`);
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(player: Socket, room: string): void {
        player.join(room);
        console.log(`Player ${player.id} joined room ${room}`);
        this.server.to(room).emit('message', `Player ${player.id} joined room ${room}`);
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(player: Socket, room: string): void {
        player.leave(room);
        console.log(`Player ${player.id} left room ${room}`);
        this.server.to(room).emit('message', `Player ${player.id} left room ${room}`);
    }
}
