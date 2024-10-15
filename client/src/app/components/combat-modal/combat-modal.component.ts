import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CombatStatsBarComponent } from '@app/components/combat-stats-bar/combat-stats-bar.component';
import { PLAYERS } from '@app/constants';
import { PlayerObjects } from '@app/interfaces/playerObject';
import { DiceComponent } from '../dice/dice.component';
import { SimpleDialogComponent } from '../simple-dialog/simple-dialog.component';
import { TemporaryDialogComponent } from '../temporary-dialog/temporary-dialog.component';
import { TimerComponent } from '../timer/timer.component';

@Component({
    selector: 'app-combat-modal',
    standalone: true,
    imports: [TimerComponent, DiceComponent, CommonModule, SimpleDialogComponent, TemporaryDialogComponent, CombatStatsBarComponent],
    templateUrl: './combat-modal.component.html',
    styleUrl: './combat-modal.component.scss',
})
export class CombatModalComponent implements OnInit {
    @Input() isInCombat = false;
    @Output() close = new EventEmitter<void>();
    @ViewChild('dice1') dice1!: DiceComponent;
    @ViewChild('dice2') dice2!: DiceComponent;
    @ViewChild('timer') timerComponent!: TimerComponent;
    @ViewChild('temporaryDialog') temporaryDialogComponent!: TemporaryDialogComponent;

    @Input() player1: PlayerObjects = PLAYERS[0];

    @Input() player2: PlayerObjects = PLAYERS[3];
    isGameOngoing: boolean = true;

    isPlayer1Damaged: boolean = false;
    isPlayer2Damaged: boolean = false;

    evasionsArray1: number[];
    evasionsArray2: number[];
    displayText: string = '';
    currentPlayerTurn: number;

    totalTime: number = 5;
    timeRemaining: number = 5;

    // maybe i should rename these variables
    playerStat1: string;
    playerStat2: string;
    statValue1: number = 0;
    statValue2: number = 0;

    ngOnInit() {
        this.player1.attributes.currentHp = this.player1.attributes.hp;
        this.player2.attributes.currentHp = this.player2.attributes.hp;
        

        this.evasionsArray1 = new Array(2).fill(1);
        this.evasionsArray2 = new Array(2).fill(1);
        this.currentPlayerTurn = this.determineStartingPlayer();
        setTimeout(() => {
            const message = this.currentPlayerTurn === 1 ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message);

            this.playerStat1 = this.currentPlayerTurn === 1 ? 'Attaque D' +  this.player1.attributes.atkDiceMax: 'Défense D' + this.player1.attributes.defDiceMax;
            this.playerStat2 = this.currentPlayerTurn === 1 ? 'Défense D' + this.player2.attributes.defDiceMax: 'Attaque' + this.player2.attributes.atkDiceMax;
        }, 100);
    }

    determineStartingPlayer(): number {
        return this.player1.attributes.speed >= this.player2.attributes.speed ? 1 : 2;
    }

    closeModal() {
        this.player1.attributes.currentHp = this.player1.attributes.hp;
        this.player2.attributes.currentHp = this.player2.attributes.hp;
        this.isInCombat = false;
        this.close.emit();
    }

    setDisplayText(text: string) {
        this.displayText = '';
        setTimeout(() => {
            this.displayText = text;
        }, 300);
    }

    dealDamage(defender: PlayerObjects, isDefenderPlayer1: boolean) {
        defender.attributes.currentHp = Math.max(0, defender.attributes.currentHp - 1);
        this.setDisplayText('1 dégat infligé sur ' + defender.name);

        this.isPlayer1Damaged = isDefenderPlayer1;
        this.isPlayer2Damaged = !isDefenderPlayer1;
    }

    attack() {
        const defender = this.currentPlayerTurn === 1 ? this.player1 : this.player2;
        const attacker = this.currentPlayerTurn === 1 ? this.player2 : this.player1;

        const isDefenderPlayer1 = this.currentPlayerTurn === 1;
        const activeDice = this.currentPlayerTurn === 1 ? this.dice1 : this.dice2;
        const inactiveDice = this.currentPlayerTurn === 1 ? this.dice2 : this.dice1;

        console.log(activeDice.diceValue);

        this.statValue2 =
            this.currentPlayerTurn === 1
                ? activeDice.diceValue + this.player1.attributes.attack
                : inactiveDice.diceValue + this.player1.attributes.defense;
        this.statValue1 =
            this.currentPlayerTurn === 2
                ? activeDice.diceValue + this.player2.attributes.attack
                : inactiveDice.diceValue + this.player2.attributes.defense;

        if (
            activeDice.diceValue + attacker.attributes.attack >
            inactiveDice.diceValue + defender.attributes.defense
        ) {
            this.dealDamage(defender, isDefenderPlayer1);
        }

        this.timerComponent.resetTimer();
        setTimeout(() => {
            this.isPlayer1Damaged = false;
            this.isPlayer2Damaged = false;
        }, 500);

        setTimeout(() => {
            const message = this.currentPlayerTurn === 1 ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message);

            this.playerStat1 = this.playerStat1.includes('Attaque') ? 'Défense D' + this.player1.attributes.defDiceMax : 'Attaque D' + this.player1.attributes.atkDiceMax;
            this.playerStat2 = this.playerStat2.includes('Attaque') ? 'Défense D' + this.player2.attributes.defDiceMax : 'Attaque D' + this.player2.attributes.atkDiceMax;
        }, 1000);

        this.checkIfDuelOver();
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
        }, 6000);
    }

    switchTurn() {
        this.currentPlayerTurn = this.currentPlayerTurn === 1 ? 2 : 1;
        const nextPlayer = this.currentPlayerTurn === 1 ? this.player1.name : this.player2.name;
        this.setDisplayText("C'est le tour de " + nextPlayer);
    }

    triggerEvade() {
        if (this.currentPlayerTurn !== 1) {
            this.setDisplayText("C'est pas votre tour!");
            return;
        }

        if (this.evasionsArray1.length === 0) {
            this.setDisplayText("Évasion pas possible, vous n'avez plus d'évasions restantes");
            return;
        }

        this.evasionsArray1.pop();

        if (Math.random() < 0.4) {
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
        this.determineTimerLength();
        if (!this.isGameOngoing) {
            return;
        }
        this.switchTurn();
        const activeDice = this.currentPlayerTurn === 1 ? this.dice1 : this.dice2;
        const inactiveDice = this.currentPlayerTurn === 1 ? this.dice2 : this.dice1;
        const defender = this.currentPlayerTurn === 1 ? this.player1 : this.player2;
        const attacker = this.currentPlayerTurn === 1 ? this.player2 : this.player1;
        
        activeDice.rollDice(attacker.attributes.atkDiceMax);
        
        setTimeout(() => {
            inactiveDice.rollDice(defender.attributes.defDiceMax);
        }, 200);
        setTimeout(() => {
            this.attack();
        }, 1200);
    }

    triggerTempDialog(message: string) {
        if(this.isGameOngoing){
            this.temporaryDialogComponent.show(message);
        }
    }

    onTimerFinished() {
        this.triggerAttack();
    }

    determineTimerLength() {
        if (this.evasionsArray1.length === 0 && this.currentPlayerTurn !== 1) {
            this.totalTime = 3;
            this.timeRemaining = 3;
        } else {
            this.totalTime = 5;
            this.timeRemaining = 5;
        }
    }
}
