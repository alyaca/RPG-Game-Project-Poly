import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class PlayerConnectionService {
    socket: Socket;

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        if (this.socket) {
            return;
        }
        this.socket = io('http://localhost:3000', { transports: ['websocket'], upgrade: false });
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
        this.socket.emit(event, ...[data, callback].filter((x) => x));
    }
}
