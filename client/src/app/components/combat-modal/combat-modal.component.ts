import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CombatStatsBarComponent } from '@app/components/combat-stats-bar/combat-stats-bar.component';
import { DiceComponent } from '@app/components/dice/dice.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import {
    ATTACK_DELAY,
    COMBAT_TURN_LENGTH,
    EXIT_COMBAT_DELAY,
    INACTIVE_DICE_DELAY,
    INIT_DISPLAY_DELAY,
    LONG_TEMP_DIALOG_DURATION,
    TEMP_DIALOG_DURATION,
    TURN_DIALOG_DELAY,
} from '@app/constants';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { CombatLogicService } from '@app/services/combat-logic/combat-logic.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';

@Component({
    selector: 'app-combat-modal',
    standalone: true,
    imports: [TimerComponent, DiceComponent, CommonModule, SimpleDialogComponent, TemporaryDialogComponent, CombatStatsBarComponent],
    templateUrl: './combat-modal.component.html',
    styleUrl: './combat-modal.component.scss',
})
export class CombatModalComponent implements OnInit, AfterViewInit {
    @Input() isInCombat = false; // isInCombat = is combat popup open ; isGameOngoing = has no winner been decided yet
    @Output() closeModalEvent = new EventEmitter<void>();
    @ViewChild('dice1') dice1!: DiceComponent;
    @ViewChild('dice2') dice2!: DiceComponent;
    @ViewChild('timer') timerComponent!: TimerComponent;
    @ViewChild('temporaryDialog') temporaryDialogComponent!: TemporaryDialogComponent;

    @Input() player1: Player = mockLobbyPlayers[0];
    @Input() player2: Player = mockLobbyPlayers[1];

    totalTime: number = COMBAT_TURN_LENGTH;
    timeRemaining: number = COMBAT_TURN_LENGTH;

    constructor(
        public combatService: CombatLogicService,
        private socketCommunicationService: SocketCommunicationService,
    ) {}

    ngOnInit() {
        this.combatService.initCombat(this.player1, this.player2);
        this.initializeDisplay();

        this.socketCommunicationService.on('fightTime', (timeRemaining: number) => {
            this.timeRemaining = timeRemaining;
        });
    }

    initializeDisplay() {
        setTimeout(() => {
            const message = this.combatService.currPlayerNum === 'player1turn' ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message, TEMP_DIALOG_DURATION);
        }, INIT_DISPLAY_DELAY);
    }

    ngAfterViewInit() {
        this.combatService.roles = {
            player1turn: { attacker: this.player2, defender: this.player1, activeDice: this.dice1, inactiveDice: this.dice2 },
            player2turn: { attacker: this.player1, defender: this.player2, activeDice: this.dice2, inactiveDice: this.dice1 },
        };
    }

    closeModal() {
        this.combatService.setDisplayText('');
        this.combatService.resetPlayerHp(this.player1, this.player2);
        this.isInCombat = false;
        this.closeModalEvent.emit();
    }

    endGameIfNeeded() {
        const finalResult: string = this.combatService.checkIfDuelOver(this.player1, this.player2);
        if (finalResult) {
            this.triggerTempDialog(finalResult, LONG_TEMP_DIALOG_DURATION);
            this.combatService.isGameOngoing = false;
            this.timerComponent.totalTime = 3;
            this.timerComponent.resetTimer();
            setTimeout(() => {
                this.closeModal();
            }, EXIT_COMBAT_DELAY);
        }
    }

    triggerTurnDialog() {
        setTimeout(() => {
            this.combatService.processTurnDialog(this.player1, this.player2);
            const message = this.combatService.currPlayerNum === 'player1turn' ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message, TEMP_DIALOG_DURATION);
        }, TURN_DIALOG_DELAY);
    }

    attack() {
        this.combatService.processAttack(this.combatService.roles, this.combatService.currPlayerNum, this.player1, this.player2);
        this.timerComponent.resetTimer();
        this.triggerTurnDialog();
        this.endGameIfNeeded();
    }

    triggerAttack() {
        this.totalTime = this.combatService.determineTimerLength(this.combatService.evasionsArray1, this.combatService.currPlayerNum);
        this.timeRemaining = this.totalTime;
        if (!this.combatService.isGameOngoing || this.combatService.attackInProgress) {
            return;
        }
        this.combatService.attackInProgress = true;

        this.combatService.switchTurn();
        const { attacker, defender, activeDice, inactiveDice } = this.combatService.roles[this.combatService.currPlayerNum];

        activeDice.rollDice(attacker.attributes.atkDiceMax);

        setTimeout(() => {
            inactiveDice.rollDice(defender.attributes.defDiceMax);
        }, INACTIVE_DICE_DELAY);

        setTimeout(() => {
            this.attack();
            this.combatService.attackInProgress = false;
        }, ATTACK_DELAY);
    }

    triggerEvade() {
        this.combatService.attemptEvade();
        this.endGameIfNeeded();
    }

    triggerTempDialog(message: string, duration: number) {
        if (this.combatService.isGameOngoing) {
            this.temporaryDialogComponent.show(message, duration);
        }
    }

    onTimerFinished() {
        if (!this.combatService.attackInProgress) {
            this.triggerAttack();
        }
    }
}
