import { Injectable } from '@angular/core';
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
        console.log('setting room id');
        this.roomId = room;
    }

    joinRoom(roomCode: string) {
        console.log('sending joinRoom');
        this.socketCommunicationService.send('joinRoom', roomCode);

        console.log('joinRoom sent');
        this.socketCommunicationService.on('joinedRoom', (roomInfo: Room) => {
            this.isJoined = true;
            this.roomId = roomInfo.roomId;
            this.selectedGame = roomInfo.gameMap;
        });
    }
}
