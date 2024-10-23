import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment.prod';

@Injectable({
    providedIn: 'root',
})
export class SocketCommunicationService {
    socket: Socket;

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        console.log('connecting');
        if (this.socket) {
            return;
        }
        console.log('socket exists');
        this.socket = io(environment.serverUrl, { transports: ['websocket'], upgrade: false });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    on<T>(event: string, action: (data: T) => void): void {
        this.socket.on(event, action);
    }

    send<T>(event: string, data?: T, callback?: () => void): void {
        console.log('STARTING SENDING');
        this.socket.emit(event, ...[data, callback].filter((x) => x));
        console.log('SENDING COMPLETE');
    }

    once<T>(event: string, action: (data: T) => void): void {
        this.socket.once(event, action);
    }
}
