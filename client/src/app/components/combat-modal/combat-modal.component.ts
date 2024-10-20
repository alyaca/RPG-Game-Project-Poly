import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit } from '@angular/core';
import { CombatStatsBarComponent } from '@app/components/combat-stats-bar/combat-stats-bar.component';
import { PLAYERS } from '@app/constants';
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
    @Input() isInCombat = false; // isInCombat = combat popup open ; isGameOngoing = winner not decided yet
    @Output() close = new EventEmitter<void>();
    @ViewChild('dice1') dice1!: DiceComponent;
    @ViewChild('dice2') dice2!: DiceComponent;
    @ViewChild('timer') timerComponent!: TimerComponent;
    @ViewChild('temporaryDialog') temporaryDialogComponent!: TemporaryDialogComponent;

    @Input() player1: PlayerObjects = PLAYERS[2];
    @Input() player2: PlayerObjects = PLAYERS[5];

    totalTime: number = 5;
    timeRemaining: number = 5;

    constructor(public combatService: CombatLogicService) {}

    ngOnInit() {
        this.combatService.initCombat(this.player1, this.player2);
        this.initializeDisplay();
    }

    initializeDisplay(){
        setTimeout(() => {
            const message = this.combatService.currPlayerNum === 1 ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message);
        }, 50);
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

    attack() {
        this.combatService.processAttack(this.combatService.roles, this.combatService.currPlayerNum, this.player1, this.player2) 
        this.timerComponent.resetTimer();
        this.triggerTurnDialog();
        this.checkIfDuelOver();
    }

    triggerTurnDialog() {
        setTimeout(() => {
            this.combatService.isPlayer1Damaged = false;
            this.combatService.isPlayer2Damaged = false;
        }, 500);

        setTimeout(() => {
            const message = this.combatService.currPlayerNum === 1 ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message);

            this.combatService.playerStat1 = this.combatService.playerStat1.includes('Attaque') ? 'Défense D' + this.player1.attributes.defDiceMax: 'Attaque D' + this.player1.attributes.atkDiceMax;
            this.combatService.playerStat2 = this.combatService.playerStat2.includes('Attaque') ? 'Défense D' + this.player2.attributes.defDiceMax: 'Attaque D' + this.player2.attributes.atkDiceMax;
        }, 1000);
    }

    checkIfDuelOver() {
        if (this.player2.attributes.currentHp === 0) {
            this.endDuel('Victoire', 'Vous avez gagné le duel');
        } else if (this.player1.attributes.currentHp === 0) {
            this.endDuel('Défaite', 'Vous avez perdu le duel');
        } else if (this.combatService.isDraw) {
            this.endDuel('Partie nulle', 'Évasion réussie');
        }
    }

    endDuel(dialogTitle: string, displayText: string) {
        this.triggerTempDialog(dialogTitle);
        this.combatService.isGameOngoing = false;
        this.combatService.setDisplayText(displayText);
        setTimeout(() => {
            this.closeModal();
        }, 3000);
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
        }, 200);

        setTimeout(() => {
            this.attack();
        }, 1200);
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
