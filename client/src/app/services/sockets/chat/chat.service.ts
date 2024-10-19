import { Injectable } from '@angular/core';
import { IMessage } from '@app/interfaces/backend-interfaces/message.interface';
import { ChatMessage } from '@app/interfaces/chatMessage';
import { SocketCommunicationService } from '../socket-communication/socket-communication.service';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    constructor(private playerConnection: SocketCommunicationService) {}

    // Envoyer un message sans le roomId (le serveur le gérera)
    sendMessage(content: string, username: string) {
        const message: IMessage = {
            username,
            message: content,
            timestamp: new Date(), // Utilisation du timestamp du client
        };

        this.playerConnection.send('sendMessage', message);
    }

    // Écouter les messages reçus
    onMessageReceived(callback: (message: ChatMessage) => void) {
        this.playerConnection.on<IMessage>('messageReceived', (backendMessage) => {
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
        return Math.floor(Math.random() * 1000000000);
    }
}
