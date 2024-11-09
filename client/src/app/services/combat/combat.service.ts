import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { ATTACK_TIME } from '@app/constants';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CombatService {
    private combatTurnTimeSource = new BehaviorSubject<number>(ATTACK_TIME);
    combatTurnTime$ = this.combatTurnTimeSource.asObservable();

    activePlayer: Player;
    opponent: Player;
    attacker: Player;
    defender: Player;
    combatStatus: string;
    turnMessage: string;
    activePlayerResult: number = 0;
    opponentResult: number = 0;
    isInCombat: boolean = false;

    constructor(
        private socketCommunicationService: SocketCommunicationService,
        private dialog: MatDialog,
    ) {}

    initializeCombat(player1: Player, player2: Player, isPlayer1Active: boolean) {
        this.activePlayer = isPlayer1Active ? player1 : player2;
        this.opponent = isPlayer1Active ? player2 : player1;
        this.attacker = player1;
        this.defender = player2;
        this.combatStatus = '';
        this.turnMessage = this.isCurrentTurn() ? "C'est votre tour" : "C'est le tour de votre adversaire";
    }

    initSocketListeners() {
        this.socketCommunicationService.on('combatTime', (timeRemaining: number) => {
            this.combatTurnTimeSource.next(timeRemaining);
        });

        this.socketCommunicationService.on('attackValues', (data: { attackValue: number; defenseValue: number }) => {
            this.attacker.attributes.attack = data.attackValue;
            this.defender.attributes.defense = data.defenseValue;
        });

        this.socketCommunicationService.on('attackSuccess', (player: Player) => {
            if (this.isAttacker(this.activePlayer)) {
                this.opponent.attributes.currentHp--;
            } else {
                this.activePlayer.attributes.currentHp--;
            }
            this.combatStatus = player.name + ' a réussi son attaque.';
        });

        this.socketCommunicationService.on('attackFail', (player: Player) => {
            this.combatStatus = player.name + ' a échoué son attaque.';
        });

        this.socketCommunicationService.on('evasionSuccess', (player: Player) => {
            this.combatStatus = player.name + " a réussi à s'évader";
        });

        this.socketCommunicationService.on('combatTurnEnded', (data: { attacker: Player; defender: Player }) => {
            this.activePlayerResult = this.determineStats(this.activePlayer);
            this.opponentResult = this.determineStats(this.opponent);
            this.attacker = data.attacker;
            this.defender = data.defender;
            this.turnMessage = this.isCurrentTurn() ? "C'est votre tour" : "C'est le tour de votre adversaire";
        });

        this.socketCommunicationService.on('playerDead', (player: Player) => {
            this.combatStatus = player.name + ' a perdu le combat.';
            this.resetPlayerHp(this.activePlayer, this.opponent);
        });

        this.socketCommunicationService.on('defaultWin', () => {
            this.onPlayerDisconnected();
            this.resetPlayerHp(this.activePlayer, this.opponent);
            this.isInCombat = false;
        });
    }

    removeListeners() {
        this.socketCommunicationService.off('combatTime');
        this.socketCommunicationService.off('attackValues');
        this.socketCommunicationService.off('attackSuccess');
        this.socketCommunicationService.off('attackFail');
        this.socketCommunicationService.off('evasionSuccess');
        this.socketCommunicationService.off('combatTurnEnded');
        this.socketCommunicationService.off('playerDead');
        this.socketCommunicationService.off('defaultWin');
    }

    onPlayerDisconnected() {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Abandon de partie',
                messages: ["L'adversaire a abandonné la partie. Vous gagnez par défaut le combat."],
            },
        });

        setTimeout(() => {
            dialogRef.close();
        }, 2000); // change for constant
    }
    resetPlayerHp(player1: Player, player2: Player) {
        player1.attributes.currentHp = player1.attributes.totalHp;
        player2.attributes.currentHp = player2.attributes.totalHp;
    }

    determineStats(player: Player) {
        return this.isAttacker(player) ? this.attacker.attributes.attack : this.defender.attributes.defense;
    }

    isAttacker(player: Player) {
        return this.attacker && player.id === this.attacker.id;
    }

    isCurrentTurn() {
        return this.socketCommunicationService.socket.id === this.attacker.id;
    }
}
