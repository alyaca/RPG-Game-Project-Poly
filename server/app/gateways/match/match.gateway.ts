import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class MatchGateway {
    @WebSocketServer()
    server: Server;
    //DES TEST A ENLEVER
    @SubscribeMessage('joinMatch')
    handleJoinMatch(@MessageBody() data: { matchId: string }, @ConnectedSocket() client: Socket): void {
        client.join(data.matchId);
        this.server.to(data.matchId).emit('userJoined', { userId: client.id });
    }

    @SubscribeMessage('leaveMatch')
    handleLeaveMatch(@MessageBody() data: { matchId: string }, @ConnectedSocket() client: Socket): void {
        client.leave(data.matchId);
        this.server.to(data.matchId).emit('userLeft', { userId: client.id });
    }

    @SubscribeMessage('sendMessage')
    handleMessage(@MessageBody() data: { matchId: string; message: string }, @ConnectedSocket() client: Socket): void {
        this.server.to(data.matchId).emit('newMessage', { userId: client.id, message: data.message });
    }
}
