import { Injectable } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class PlayerConnectionService {
    socket: Socket;

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        if (!this.isSocketAlive()) {
            this.socket = io(environment.serverUrl, { transports: ['websocket'], upgrade: false });
        }
    }

    // connectToRoom(room: Room) {
    //     if (room) {
    //         this.socket.on(`addingPlayerToRoom:${room.id}`, (player) => {
    //             room.listPlayers.push(player); // Player interface
    //         });
    //     }
    // }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    on<T>(event: string, action: (data: T) => void): void {
        this.socket.on(event, action);
    }

    send<T>(event: string, data?: T, callback?: Function): void {
        this.socket.emit(event, ...[data, callback].filter((x) => x));
    }
}
