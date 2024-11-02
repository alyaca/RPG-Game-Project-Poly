import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';

@Injectable({
    providedIn: 'root',
})
export class SocketCommunicationService {
    socket: Socket;

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        if (this.socket) {
            return;
        }
        //  First link is for production (deployment)
        //  Second is to test locally (npm start and all that)
        //  this.socket = io('http://ec2-3-96-205-250.ca-central-1.compute.amazonaws.com:3000/');
        this.socket = io('http://localhost:3000/');
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
}
