import { Injectable } from '@angular/core';
import { CombatInfo } from '@common/combat-info';
import { Player } from '@common/player';
import { SocketCommunicationService } from '../socket-communication/socket-communication.service';
@Injectable({
    providedIn: 'root',
})
export class CombatService {
    public player1: Player;
    public player2: Player;

    combatInfo: CombatInfo = {
        isPlayer1Damaged: false,
        isPlayer2Damaged: false,
        statValue1: 0,
        statValue2: 0,
        displayText: '',
        isGameOngoing: true,
        currPlayerNum: '',
        evasionsArray1: new Array(2).fill(1),
        evasionsArray2: new Array(2).fill(1),
        playerStat1: '',
        playerStat2: '',
        roles: {},
        isDraw: false,

        attackInProgress: false,
    };

    constructor(private socketCommunication: SocketCommunicationService) {}

    OnCombatReceived(callback: (player1: Player, player2: Player) => void) {
        this.socketCommunication.on('receivedCombat', (data: { player1: Player; player2: Player }) => {
            callback(data.player1, data.player2);
            this.player1 = data.player1;
            this.player2 = data.player2;
        });
    }
}
