import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
import { ATTACK_TIME, DialogMessages, DialogTitle, INFO_DIALOG_TIME } from '@app/constants';
import { TempDialogData } from '@app/interfaces/temp-dialog-data';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { CombatPlayers } from '@common/combat-player';
import { CombatResult, CombatResultDetails } from '@common/combat-result';
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
    canAttackOrEvade: boolean = false;

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
        this.canAttackOrEvade = true;
        this.evasionsActivePlayer = new Array(2).fill(1);
        this.evasionsOpponent = new Array(2).fill(1);
        this.setTurnMessage();
    }

    initSocketListeners() {
        this.socketCommunicationService.on('combatTime', (timeRemaining: number) => {
            this.combatTurnTimeSource.next(timeRemaining);
        });

        this.socketCommunicationService.on('attackValues', (combatResultDetails: CombatResultDetails) => {
            this.onAttackValues(combatResultDetails);
        });

        this.socketCommunicationService.on('attackSuccess', (player: Player) => {
            this.onAttackSuccess(player);
        });

        this.socketCommunicationService.on('attackFail', (data: { attacker: Player; shouldDamageSelf: boolean }) => {
            this.combatStatus = data.attacker.name + ' a échoué son attaque.';
            if (data.shouldDamageSelf) {
                this.onAttackFailWithArmor();
            }
        });

        this.socketCommunicationService.on('evasionSuccess', (data: { listPlayers: Player[]; player: Player }) => {
            this.onEvasion(data.player);
        });

        this.socketCommunicationService.on('evasionFail', (player: Player) => {
            this.combatStatus = player.name + " n'a pas réussi à s'évader.";
            const evasionsLeft = this.isAttacker(this.activePlayer) ? this.evasionsActivePlayer : this.evasionsOpponent;
            evasionsLeft.pop();
        });

        this.socketCommunicationService.on('combatTurnEnded', (data: { combatPlayers: CombatPlayers; failEvasion: boolean }) => {
            this.onCombatTurnEnded(data.combatPlayers, data.failEvasion);
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
        if (this.isInCombat) {
            this.openTempDialog({
                title: DialogTitle.EndFight,
                message: DialogMessages.EndFight + winner?.name,
                duration: INFO_DIALOG_TIME,
            }).subscribe(() => {
                this.isInCombat = false;
            });
        }
    }

    onCombatTurnEnded(combatPlayers: CombatPlayers, failEvasion: boolean) {
        if (!failEvasion) {
            this.activePlayerResult = this.determineStats(this.activePlayer);
            this.opponentResult = this.determineStats(this.opponent);
        }
        this.canAttackOrEvade = true;
        this.attacker = combatPlayers.attacker;
        this.defender = combatPlayers.defender;
        this.setTurnMessage();
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

    onAttackSuccess(player: Player) {
        if (this.isAttacker(this.activePlayer)) {
            this.opponent.attributes.currentHp--;
        } else {
            this.activePlayer.attributes.currentHp--;
        }
        this.combatStatus = player.name + ' a réussi son attaque.';
    }

    onAttackFailWithArmor() {
        if (this.isAttacker(this.activePlayer)) {
            this.activePlayer.attributes.currentHp--;
        } else {
            this.opponent.attributes.currentHp--;
        }
    }

    onAttackValues(combatResultDetails: CombatResultDetails) {
        this.attackResult = combatResultDetails.attackValues;
        this.defenseResult = combatResultDetails.defenseValues;
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

    setTurnMessage() {
        this.turnMessage = this.isCurrentTurn() ? "C'est votre tour" : "C'est le tour de votre adversaire";
    }
}
