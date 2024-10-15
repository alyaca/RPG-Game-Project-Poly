import { Injectable } from '@angular/core';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';
import { Game } from '@common/game';
import { Room } from '@common/room';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    roomId: string;
    isRoomLocked: boolean;
    isJoined: boolean = false;
    selectedGame: Game;

    constructor(private playerConnectionService: PlayerConnectionService) {}

    setRoomId(room: string) {
        this.roomId = room;
    }

    joinRoom(roomCode: string) {
        this.playerConnectionService.send('joinRoom', roomCode);

        this.playerConnectionService.on('joinedRoom', (roomInfo: Room) => {
            this.isJoined = true;
            this.roomId = roomInfo.roomId;
            this.selectedGame = roomInfo.gameMap;
        });
    }
}
