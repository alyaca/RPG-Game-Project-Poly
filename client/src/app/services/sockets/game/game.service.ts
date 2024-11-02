import { Injectable } from '@angular/core';
import { MAX_PLAYER_LARGE_MAP, MAX_PLAYER_MEDIUM_MAP, MAX_PLAYER_SMALL_MAP, SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
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

    constructor(private socketCommunicationService: SocketCommunicationService) {}

    setRoomId(room: string) {
        this.roomId = room;
    }

    joinRoom(roomCode: string) {
        this.socketCommunicationService.send('joinRoom', roomCode);

        this.socketCommunicationService.on('joinedRoom', (roomInfo: Room) => {
            this.isJoined = true;
            this.roomId = roomInfo.roomId;
            this.selectedGame = roomInfo.gameMap;
        });
    }

    getPlayerNumber(height: number): number {
        switch (height) {
            case SIZE_SMALL_MAP:
                return MAX_PLAYER_SMALL_MAP;
            case SIZE_MEDIUM_MAP:
                return MAX_PLAYER_MEDIUM_MAP;
            case SIZE_LARGE_MAP:
                return MAX_PLAYER_LARGE_MAP;
            default:
                throw new Error('Nombre de joueur invalide');
        }
    }
}
