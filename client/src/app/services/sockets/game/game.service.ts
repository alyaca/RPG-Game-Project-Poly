import { Injectable } from '@angular/core';
import { PlayerConnectionService } from '../player-connection/player-connection.service';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    roomId: string;
    isRoomLocked: boolean;
    isJoined: boolean = false;

    constructor(private playerConnectionService: PlayerConnectionService) {}

    setRoomId(room: string) {
        this.roomId = room;
    }

    joinRoom(roomCode: string) {
        this.playerConnectionService.send('joinRoom', roomCode);
        this.playerConnectionService.on<string>('joinedRoom', (roomCode) => {
            this.isJoined = true;
            console.log('Joined room:', roomCode);
        });
    }
}
