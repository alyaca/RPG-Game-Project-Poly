import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MAX_GENERATION_VALUE } from '@app/constants';
import { ILogMessage } from '@app/interfaces/backend-interfaces/log.interface';
import { IMessage } from '@app/interfaces/backend-interfaces/message.interface';
import { ChatMessage } from '@app/interfaces/chat-message';
import { LogMessage } from '@app/interfaces/log-message';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { ClientToServerEvent, ServerToClientEvent } from '@common/socket.events';
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

        this.socketCommunication.send(ClientToServerEvent.SendMessage, message);
    }

    onMessageReceived(callback: (message: ChatMessage) => void) {
        this.socketCommunication.on<IMessage>(ServerToClientEvent.MessageReceived, (backendMessage) => {
            const formattedMessage: ChatMessage = {
                id: this.generateUniqueId(),
                username: backendMessage.username,
                message: backendMessage.message,
                timestamp: backendMessage.timestamp,
            };
            callback(formattedMessage);
        });
    }

    onLogReceived(callback: (message: LogMessage) => void) {
        this.socketCommunication.on<ILogMessage>(ServerToClientEvent.LogReceived, (backendMessage) => {
            const formattedMessage: LogMessage = {
                id: this.generateUniqueId(),
                message: backendMessage.message,
                timestamp: backendMessage.timestamp,
                players: backendMessage.players,
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
