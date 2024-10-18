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
        // Récupérer l'ID de la salle de l'utilisateur
        const roomId = this.roomService.getRoomId(client);
        // const roomId = client.data.roomCode;
        this.logger.log(`Message received: ${message.message} from ${message.username} with roomCode: ${client.data.roomCode}`);

        // Vérifier si l'utilisateur est dans une room
        if (!roomId) {
            this.logger.error('User must be in a room to send messages.');
            client.emit('errorMessage', 'You must be in a room to send messages.');
            return;
        }

        if (message.message.length > 200) {
            client.emit('errorMessage', 'Message exceeds the 200 characters limit.');
            return;
        }

        // Créer le message avec le roomId
        const messageWithRoomId: IMessage = {
            roomId,
            username: message.username,
            message: message.message,
            timestamp: new Date(),
        };

        // Enregistrement du message
        this.chatService
            .saveMessage(messageWithRoomId)
            .then((savedMessage) => {
                this.logger.log(`Message saved: ${savedMessage.message} from ${savedMessage.username}`);

                // Permet d'Utiliser le serveur de RoomService pour diffuser le message
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
