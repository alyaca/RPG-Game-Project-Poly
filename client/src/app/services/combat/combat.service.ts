import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
import { ATTACK_TIME, DialogMessages, DialogTitle, DISPLAY_DICE_DELAY, INFO_DIALOG_TIME } from '@app/constants';
import { TempDialogData } from '@app/interfaces/temp-dialog-data';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { CombatPlayers } from '@common/combat-player';
import { CombatResult } from '@common/combat-result';
import { Player } from '@common/player';
import { BehaviorSubject } from 'rxjs';
@Injectable({
    providedIn: 'root',
})
export class CombatService {
    /* eslint-disable @typescript-eslint/member-ordering */
    private combatTurnTimeSource = new BehaviorSubject<number>(ATTACK_TIME);
    combatTurnTime$ = this.combatTurnTimeSource.asObservable();

    activePlayer: Player;
    opponent: Player;
    attacker: Player;
    defender: Player;
    combatStatus: string = '';
    turnMessage: string;
    activePlayerResult: CombatResult;
    opponentResult: CombatResult;
    isInCombat: boolean = false;
    evasionsActivePlayer: number[];
    evasionsOpponent: number[];
    isRolling: boolean = true;
    private attackResult: CombatResult;
    private defenseResult: CombatResult;

    constructor(
        private socketCommunicationService: SocketCommunicationService,
        private dialog: MatDialog,
    ) {
        this.activePlayerResult = { total: 0, diceValue: 1 };
        this.opponentResult = { total: 0, diceValue: 1 };
    }

    initializeCombat(player1: Player, player2: Player, isPlayer1Active: boolean) {
        this.activePlayer = isPlayer1Active ? player1 : player2;
        this.opponent = isPlayer1Active ? player2 : player1;
        this.attacker = player1;
        this.defender = player2;
        this.isInCombat = true;
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

        this.socketCommunicationService.on('evasionFail', (player: Player) => {
            this.combatStatus = player.name + " n'a pas réussi à s'évader.";
            const evasionsLeft = this.isAttacker(this.activePlayer) ? this.evasionsActivePlayer : this.evasionsOpponent;
            evasionsLeft.pop();
        });

        this.socketCommunicationService.on('combatTurnEnded', (data: { combatPlayers: CombatPlayers; failEvasion: boolean }) => {
            if (!data.failEvasion) {
                this.activePlayerResult = this.determineStats(this.activePlayer);
                this.opponentResult = this.determineStats(this.opponent);
            }
            this.attacker = data.combatPlayers.attacker;
            this.defender = data.combatPlayers.defender;
            this.turnMessage = this.isCurrentTurn() ? "C'est votre tour" : "C'est le tour de votre adversaire";
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
        this.socketCommunicationService.off('evasionFail');
        this.socketCommunicationService.off('combatTurnEnded');
        this.socketCommunicationService.off('defaultWin');
    }

    evasionLeft() {
        const evasionsLeft = this.isAttacker(this.activePlayer) ? this.evasionsActivePlayer : this.evasionsOpponent;
        return evasionsLeft.length > 0;
    }

    onPlayerDisconnected() {
        this.dialog.open(TemporaryDialogComponent, {
            disableClose: true,
            data: {
                title: DialogTitle.DefaultFightWin,
                message: DialogMessages.DefaultFightWin,
                duration: INFO_DIALOG_TIME,
            },
        });
    }

    onCombatEnd(winner: Player) {
        this.openTempDialog({
            title: DialogTitle.EndFight,
            message: DialogMessages.EndFight + winner?.name,
            duration: INFO_DIALOG_TIME,
        }).subscribe(() => {
            this.isInCombat = false;
        });
    }

    onEvasion(player: Player) {
        this.openTempDialog({
            title: DialogTitle.SuccessEvasion,
            message: player?.name + " a réussi à s'évader !",
            duration: INFO_DIALOG_TIME,
        }).subscribe(() => {
            this.isInCombat = false;
        });
    }

    openTempDialog(dialogData: TempDialogData) {
        const dialogRef = this.dialog.open(TemporaryDialogComponent, {
            disableClose: true,
            data: dialogData,
        });
        return dialogRef.afterClosed();
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

    isCurrentPlayer(player: Player) {
        return this.socketCommunicationService.socket.id === player.id;
    }
}
