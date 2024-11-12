import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { ATTACK_TIME, DISPLAY_DICE_DELAY, INFO_DIALOG_TIME } from '@app/constants';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';
import { BehaviorSubject } from 'rxjs';
//import { NavigationService } from '../navigation/navigation.service';
import { CombatResult } from '@common/combat-result';
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
    activePlayerResult: CombatResult = { total: 0, diceValue: 1 };
    opponentResult: CombatResult = { total: 0, diceValue: 1 };
    attackResult: CombatResult;
    defenseResult: CombatResult;
    isInCombat: boolean = false;
    evasionsActivePlayer: number[];
    evasionsOpponent: number[];
    isRolling: boolean = true;

    constructor(
        private socketCommunicationService: SocketCommunicationService,
        private dialog: MatDialog, //        private navigationService: NavigationService,
    ) {}

    initializeCombat(player1: Player, player2: Player, isPlayer1Active: boolean) {
        this.activePlayer = isPlayer1Active ? player1 : player2;
        this.opponent = isPlayer1Active ? player2 : player1;
        this.attacker = player1;
        this.defender = player2;
        this.combatStatus = '';
        this.evasionsActivePlayer = new Array(2).fill(1);
        this.evasionsOpponent = new Array(2).fill(1);
        this.turnMessage = this.isCurrentTurn() ? "C'est votre tour" : "C'est le tour de votre adversaire";
    }

    initSocketListeners() {
        this.socketCommunicationService.on('combatTime', (timeRemaining: number) => {
            this.combatTurnTimeSource.next(timeRemaining);
        });

        this.socketCommunicationService.on('attackValues', (data: { attackValue: CombatResult; defenseValue: CombatResult }) => {
            this.attacker.attributes.attack = data.attackValue.total;
            this.defender.attributes.defense = data.defenseValue.total;
            this.attackResult = data.attackValue;
            this.defenseResult = data.defenseValue;
            this.isRolling = false;

            setTimeout(() => {
                this.isRolling = true;
            }, DISPLAY_DICE_DELAY);
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
            this.onEvasion(player);
        });

        this.socketCommunicationService.on('evasionFail', (player: Player) => {
            this.combatStatus = player.name + " n'a pas réussi à s'évader.";
            const evasionsLeft = this.isAttacker(this.activePlayer) ? this.evasionsActivePlayer : this.evasionsOpponent;
            evasionsLeft.pop();
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
            // this.navigationService.replacePlayerOnSpawnPoint(player);
        });

        this.socketCommunicationService.on('defaultWin', () => {
            this.onPlayerDisconnected();
            this.isInCombat = false;
        });
    }

    removeListeners() {
        this.socketCommunicationService.off('combatTime');
        this.socketCommunicationService.off('attackValues');
        this.socketCommunicationService.off('attackSuccess');
        this.socketCommunicationService.off('attackFail');
        this.socketCommunicationService.off('evasionSuccess');
        this.socketCommunicationService.off('evasionFail');
        this.socketCommunicationService.off('combatTurnEnded');
        //this.socketCommunicationService.off('playerDead');
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
        }, INFO_DIALOG_TIME);
    }

    onEvasion(player: Player) {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Evasion',
                messages: [`${player.name} a réussi à s'évader !`],
            },
        });

        setTimeout(() => {
            dialogRef.close();
        }, INFO_DIALOG_TIME);
    }

    resetPlayerHp(player1: Player, player2: Player) {
        player1.attributes.currentHp = player1.attributes.totalHp;
        player2.attributes.currentHp = player2.attributes.totalHp;
    }

    determineStats(player: Player) {
        return this.isAttacker(player) ? this.attackResult : this.defenseResult;
    }

    isAttacker(player: Player) {
        return this.attacker && player.id === this.attacker.id;
    }

    isCurrentTurn() {
        return this.socketCommunicationService.socket.id === this.attacker.id;
    }
}
