import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit } from '@angular/core';
import { CombatStatsBarComponent } from '@app/components/combat-stats-bar/combat-stats-bar.component';
import { EVADE_SUCCES_RATE, PLAYERS } from '@app/constants';
import { PlayerObjects } from '@app/interfaces/playerObject';
import { DiceComponent } from '@app/components/dice/dice.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { CombatLogicService, Roles } from '@app/services/combat-logic.service';

@Component({
    selector: 'app-combat-modal',
    standalone: true,
    imports: [TimerComponent, DiceComponent, CommonModule, SimpleDialogComponent, TemporaryDialogComponent, CombatStatsBarComponent],
    templateUrl: './combat-modal.component.html',
    styleUrl: './combat-modal.component.scss',
})

export class CombatModalComponent implements OnInit, AfterViewInit {
    @Input() isInCombat = false;
    @Output() close = new EventEmitter<void>();
    @ViewChild('dice1') dice1!: DiceComponent;
    @ViewChild('dice2') dice2!: DiceComponent;
    @ViewChild('timer') timerComponent!: TimerComponent;
    @ViewChild('temporaryDialog') temporaryDialogComponent!: TemporaryDialogComponent;

    @Input() player1: PlayerObjects = PLAYERS[2];
    @Input() player2: PlayerObjects = PLAYERS[5];
    isGameOngoing: boolean = true;

    displayText: string = '';
    currPlayerNum: number;

    totalTime: number = 5;
    timeRemaining: number = 5;

    evasionsArray1: number[];
    evasionsArray2: number[];
    // maybe i should rename these variables
    playerStat1: string;
    playerStat2: string;

    roles: Roles;

    constructor(public combatService: CombatLogicService) {}

    ngOnInit() {
        this.combatService.resetPlayerHp(this.player1, this.player2);
        this.evasionsArray1 = new Array(2).fill(1);
        this.evasionsArray2 = new Array(2).fill(1);
        this.currPlayerNum = this.combatService.determineStartingPlayer(this.player1, this.player2);
        this.initializeDisplay();
    }

    initializeDisplay(){
        setTimeout(() => {
            const message = this.currPlayerNum === 1 ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message);

            this.playerStat1 =
                this.currPlayerNum === 1 ? 'Attaque D' + this.player1.attributes.atkDiceMax : 'Défense D' + this.player1.attributes.defDiceMax;
            this.playerStat2 =
                this.currPlayerNum === 1 ? 'Défense D' + this.player2.attributes.defDiceMax : 'Attaque' + this.player2.attributes.atkDiceMax;
        }, 50);
    }

    ngAfterViewInit() {
        this.roles = {
            1: { attacker: this.player2, defender: this.player1, activeDice: this.dice1, inactiveDice: this.dice2 },
            2: { attacker: this.player1, defender: this.player2, activeDice: this.dice2, inactiveDice: this.dice1 },
        };
    }

    closeModal() {
        this.combatService.resetPlayerHp(this.player1, this.player2);
        this.isInCombat = false;
        this.close.emit();
    }

    setDisplayText(text: string) {
        this.displayText = '';
        setTimeout(() => {
            this.displayText = text;
        }, 300);
    }

    attack() {
        const { defender } = this.roles[this.currPlayerNum];
        if(this.combatService.processAttack(this.roles, this.currPlayerNum, this.player1, this.player2)){
            this.setDisplayText('1 dégat infligé sur ' + defender.name);
        }   
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
            const message = this.currPlayerNum === 1 ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message);

            this.playerStat1 = this.playerStat1.includes('Attaque') ? 'Défense D' + this.player1.attributes.defDiceMax: 'Attaque D' + this.player1.attributes.atkDiceMax;
            this.playerStat2 = this.playerStat2.includes('Attaque') ? 'Défense D' + this.player2.attributes.defDiceMax: 'Attaque D' + this.player2.attributes.atkDiceMax;
        }, 1000);
    }

    checkIfDuelOver() {
        if (this.player2.attributes.currentHp === 0) {
            this.endDuel('Victoire', 'Vous avez gagné le duel');
        } else if (this.player1.attributes.currentHp === 0) {
            this.endDuel('Défaite', 'Vous avez perdu le duel');
        }
    }

    endDuel(dialogTitle: string, displayText: string) {
        this.triggerTempDialog(dialogTitle);
        this.isGameOngoing = false;
        this.setDisplayText(displayText);
        setTimeout(() => {
            this.closeModal();
        }, 3000);
    }

    switchTurn() {
        this.currPlayerNum = this.currPlayerNum === 1 ? 2 : 1;
        const nextPlayer = this.currPlayerNum === 1 ? this.player1.name : this.player2.name;
        this.setDisplayText("C'est le tour de " + nextPlayer);
    }

    triggerEvade() {
        if (this.evasionsArray1.length === 0) {
            this.setDisplayText("Évasion pas possible, vous n'avez plus d'évasions restantes");
            return;
        }

        this.evasionsArray1.pop();
        this.attemptEvade();
    }

    attemptEvade() {
        if (Math.random() < EVADE_SUCCES_RATE) {
            this.triggerTempDialog('Évasion réussie, partie nulle');
            this.isGameOngoing = false;
            setTimeout(() => {
                this.closeModal();
            }, 3000);
        } else {
            this.setDisplayText('Évasion échouée');
        }
    }

    triggerAttack() {
        this.totalTime = this.combatService.determineTimerLength(this.evasionsArray1, this.currPlayerNum);
        this.timeRemaining = this.totalTime;
        if (!this.isGameOngoing) {
            return;
        }
        this.switchTurn();
        const { attacker, defender, activeDice, inactiveDice } = this.roles[this.currPlayerNum];

        activeDice.rollDice(attacker.attributes.atkDiceMax);

        setTimeout(() => {
            inactiveDice.rollDice(defender.attributes.defDiceMax);
        }, 200);

        setTimeout(() => {
            this.attack();
        }, 1200);
    }

    triggerTempDialog(message: string) {
        if (this.isGameOngoing) {
            this.temporaryDialogComponent.show(message);
        }
    }

    onTimerFinished() {
        this.triggerAttack();
    }
}
