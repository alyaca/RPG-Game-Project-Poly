import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SocketCommunicationService {
    socket: Socket;

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        if (this.isSocketAlive()) {
            return;
        }
        this.socket = io(environment.socketUrl);
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

    once<T>(event: string, action: (data: T) => void): void {
        this.socket.once(event, action);
    }

    off(event: string) {
        this.socket.off(event);
    }
}
