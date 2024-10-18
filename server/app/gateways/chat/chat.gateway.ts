import { IMessage } from '@app/interfaces/message.interface'; // Importation de l'interface IMessage
import { ChatService } from '@app/services/chat/chat.service'; // Importation du ChatService
import { RoomService } from '@app/services/room/room.service'; // Importation du RoomService
import { Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatEvents } from './chat.gateway.events';

@WebSocketGateway({ cors: true })
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly roomService: RoomService,
        private readonly logger: Logger,
    ) {}

    @SubscribeMessage(ChatEvents.SendMessage)
    handleMessage(client: Socket, message: IMessage): void {
        const roomId = this.roomService.getRoomId(client);
        this.logger.log(`Message received: ${message.message} from ${message.username} with roomCode: ${client.data.roomCode}`);

        const messageWithRoomId: IMessage = {
            roomId,
            username: message.username,
            message: message.message,
            timestamp: new Date(),
        };

        this.chatService
            .saveMessage(messageWithRoomId)
            .then((savedMessage) => {
                this.logger.log(`Message saved: ${savedMessage.message} from ${savedMessage.username}`);

                console.log('juste avant d appeler getServer');
                const roomServer = this.roomService.getServer();
                roomServer.to(roomId).emit('messageReceived', savedMessage);
            })
            .catch((error) => {
                this.logger.error(`Failed to save message: ${error.message}`);
                client.emit('errorMessage', 'Failed to send message.');
            });
    }
}
