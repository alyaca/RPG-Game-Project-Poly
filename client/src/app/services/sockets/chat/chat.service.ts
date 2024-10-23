import { Injectable } from '@angular/core';
import { MAX_GENERATION_VALUE } from '@app/constants';
import { IMessage } from '@app/interfaces/backend-interfaces/message.interface';
import { ChatMessage } from '@app/interfaces/chat-message';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    constructor(private socketCommunication: SocketCommunicationService) {}

    // Envoyer un message sans le roomId (le serveur le gérera)
    sendMessage(content: string) {
        const username = 'Player';
        const message: IMessage = {
            username,
            message: content,
            timestamp: new Date(),
        };

        this.socketCommunication.send('sendMessage', message);
    }

    // Écouter les messages reçus
    onMessageReceived(callback: (message: ChatMessage) => void) {
        this.socketCommunication.on<IMessage>('messageReceived', (backendMessage) => {
            const formattedMessage: ChatMessage = {
                id: this.generateUniqueId(),
                username: backendMessage.username,
                message: backendMessage.message,
                timestamp: backendMessage.timestamp,
            };
            callback(formattedMessage);
        });
    }

    // Générer un identifiant unique pour chaque message côté front
    private generateUniqueId(): number {
        return Math.floor(Math.random() * MAX_GENERATION_VALUE);
    }
}
