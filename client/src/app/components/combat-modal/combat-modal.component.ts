import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit } from '@angular/core';
import { CombatStatsBarComponent } from '@app/components/combat-stats-bar/combat-stats-bar.component';
import {
    PLAYERS,
    COMBAT_TURN_LENGTH,
    INIT_DISPLAY_DELAY,
    EXIT_COMBAT_DELAY,
    INACTIVE_DICE_DELAY,
    ATTACK_DELAY,
    TURN_DIALOG_DELAY,
} from '@app/constants';
import { PlayerObjects } from '@app/interfaces/playerObject';
import { DiceComponent } from '@app/components/dice/dice.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { CombatLogicService } from '@app/services/combat-logic.service';

@Component({
    selector: 'app-combat-modal',
    standalone: true,
    imports: [TimerComponent, DiceComponent, CommonModule, SimpleDialogComponent, TemporaryDialogComponent, CombatStatsBarComponent],
    templateUrl: './combat-modal.component.html',
    styleUrl: './combat-modal.component.scss',
})
export class CombatModalComponent implements OnInit, AfterViewInit {
    @Input() isInCombat = false; // isInCombat = is combat popup open ; isGameOngoing = has no winner been decided yet
    @Output() close = new EventEmitter<void>();
    @ViewChild('dice1') dice1!: DiceComponent;
    @ViewChild('dice2') dice2!: DiceComponent;
    @ViewChild('timer') timerComponent!: TimerComponent;
    @ViewChild('temporaryDialog') temporaryDialogComponent!: TemporaryDialogComponent;

    @Input() player1: PlayerObjects = PLAYERS[2];
    @Input() player2: PlayerObjects = PLAYERS[5];

    totalTime: number = COMBAT_TURN_LENGTH;
    timeRemaining: number = COMBAT_TURN_LENGTH;

    constructor(public combatService: CombatLogicService) {}

    ngOnInit() {
        this.combatService.initCombat(this.player1, this.player2);
        this.initializeDisplay();
    }

    initializeDisplay() {
        setTimeout(() => {
            const message = this.combatService.currPlayerNum === 1 ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message);
        }, INIT_DISPLAY_DELAY);
    }

    ngAfterViewInit() {
        this.combatService.roles = {
            1: { attacker: this.player2, defender: this.player1, activeDice: this.dice1, inactiveDice: this.dice2 },
            2: { attacker: this.player1, defender: this.player2, activeDice: this.dice2, inactiveDice: this.dice1 },
        };
    }

    closeModal() {
        this.combatService.setDisplayText('');
        this.combatService.resetPlayerHp(this.player1, this.player2);
        this.isInCombat = false;
        this.close.emit();
    }

    endGameIfNeeded() {
        const finalResult: string = this.combatService.checkIfDuelOver(this.player1, this.player2);
        if (finalResult) {
            this.triggerTempDialog(finalResult);
            this.combatService.isGameOngoing = false;
            setTimeout(() => {
                this.closeModal();
            }, EXIT_COMBAT_DELAY);
        }
    }

    triggerTurnDialog() {
        setTimeout(() => {
            this.combatService.processTurnDialog(this.player1, this.player2);
            const message = this.combatService.currPlayerNum === 1 ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message);
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
        if (!this.combatService.isGameOngoing) {
            return;
        }
        this.combatService.switchTurn(this.player1, this.player2);
        const { attacker, defender, activeDice, inactiveDice } = this.combatService.roles[this.combatService.currPlayerNum];

        activeDice.rollDice(attacker.attributes.atkDiceMax);

        setTimeout(() => {
            inactiveDice.rollDice(defender.attributes.defDiceMax);
        }, INACTIVE_DICE_DELAY);

        setTimeout(() => {
            this.attack();
        }, ATTACK_DELAY);
    }

    triggerEvade() {
        this.combatService.attemptEvade();
        this.endGameIfNeeded();
    }

    triggerTempDialog(message: string) {
        if (this.combatService.isGameOngoing) {
            this.temporaryDialogComponent.show(message);
        }
    }

    onTimerFinished() {
        this.triggerAttack();
    }
}
