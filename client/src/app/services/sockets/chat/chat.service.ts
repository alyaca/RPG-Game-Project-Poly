import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MAX_GENERATION_VALUE } from '@app/constants';
import { IMessage } from '@app/interfaces/backend-interfaces/message.interface';
import { ChatMessage } from '@app/interfaces/chat-message';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ChatService {
    private chatsUrl = `${environment.serverUrl}/chat`;
    constructor(
        private socketCommunication: SocketCommunicationService,
        private http: HttpClient,
    ) {}

    sendMessage(content: string) {
        const username = 'Player';
        const message: IMessage = {
            username,
            message: content,
            timestamp: new Date(),
        };

        this.socketCommunication.send('sendMessages', message);
    }

    // Listen to messages received from the server
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

    generateUniqueId(): number {
        return Math.floor(Math.random() * MAX_GENERATION_VALUE);
    }

    getMessagesByRoom(roomCode: string): Observable<ChatMessage[]> {
        const params = new HttpParams().set('roomCode', roomCode);
        return this.http.get<ChatMessage[]>(this.chatsUrl, { params }).pipe(
            map((messages: ChatMessage[]) =>
                messages.map((backendMessage) => ({
                    id: this.generateUniqueId(),
                    username: backendMessage.username,
                    message: backendMessage.message,
                    timestamp: backendMessage.timestamp,
                })),
            ),
        );
    }
}
