import { Injectable } from '@angular/core';
import { Player } from '@common/player';
import { SocketCommunicationService } from '../socket-communication/socket-communication.service';

@Injectable({
    providedIn: 'root',
})
export class CombatService {
    public player1: Player;
    public player2: Player;

    constructor(private socketCommunication: SocketCommunicationService) {}

    OnCombatReceived(callback: (player1: Player, player2: Player) => void) {
        this.socketCommunication.on('receivedCombat', (data: { player1: Player; player2: Player }) => {
            callback(data.player1, data.player2);
            this.player1 = data.player1;
            this.player2 = data.player2;
        });
    }
}
