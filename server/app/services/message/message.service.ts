import { IMessage } from '@app/interfaces/message.interface';
import { ChatService } from '@app/services/chat/chat.service';
import { ServerToClientEvent } from '@common/socket.events';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';

@Injectable()
export class MessageService {
    constructor(
        private chatService: ChatService,
        private roomService: RoomService,
    ) {}

    async onMessageReceived(client: Socket, server: Server, message: IMessage) {
        const roomId = this.roomService.getRoomId(client);

        const messageWithRoomId: IMessage = {
            roomId,
            username: client.data.username,
            message: message.message,
            timestamp: message.timestamp,
        };
        await this.saveMessage(client, server, messageWithRoomId);
    }

    async saveMessage(client: Socket, server: Server, message: IMessage) {
        try {
            const savedMessage = await this.chatService.saveMessage(message);
            server.to(message.roomId).emit(ServerToClientEvent.MessageReceived, savedMessage);
        } catch (error) {
            client.emit(ServerToClientEvent.ErrorMessage, 'Failed to send message.');
        }
    }
}
