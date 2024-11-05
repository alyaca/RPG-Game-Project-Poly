import { Injectable } from '@angular/core';
import { Player } from '@common/player';
import { SocketCommunicationService } from '../socket-communication/socket-communication.service';
import { Roles } from '@common/roles'
@Injectable({
    providedIn: 'root',
})

export class CombatService {
    public player1: Player;
    public player2: Player;

    isPlayer1Damaged: boolean = false;
    isPlayer2Damaged: boolean = false;
    statValue1: number = 0;
    statValue2: number = 0;

    displayText: string = '';
    isGameOngoing: boolean = true;

    currPlayerNum: string;

    evasionsArray1: number[];
    evasionsArray2: number[];
    playerStat1: string;
    playerStat2: string;
    roles: Roles;
    isDraw: boolean;

    attackInProgress: boolean = false;

    constructor(private socketCommunication: SocketCommunicationService) {}

    OnCombatReceived(callback: (player1: Player, player2: Player) => void) {
        this.socketCommunication.on('receivedCombat', (data: { player1: Player; player2: Player }) => {
            callback(data.player1, data.player2);
            this.player1 = data.player1;
            this.player2 = data.player2;
        });
    }
}
