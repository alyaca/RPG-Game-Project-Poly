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
    @ViewChild('dice1') diceComponent1!: DiceComponent;
    @ViewChild('dice2') diceComponent2!: DiceComponent;
    @ViewChild('timer') timerComponent!: TimerComponent;
    @ViewChild('temporaryDialog') temporaryDialogComponent!: TemporaryDialogComponent;

    @Input() playerInfo1: PlayerObjects = PLAYERS[0];

    @Input() playerInfo2: PlayerObjects = PLAYERS[1];
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
        this.evasionsArray1 = new Array(2).fill(1);
        this.evasionsArray2 = new Array(2).fill(1);
        this.currentPlayerTurn = this.determineStartingPlayer();
        setTimeout(() => {
            const message = this.currentPlayerTurn === 1 ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message);

            this.playerStat1 = this.currentPlayerTurn === 1 ? 'Attaque' : 'Défense';
            this.playerStat2 = this.currentPlayerTurn === 1 ? 'Défense' : 'Attaque';
        }, 100);
    }

    determineStartingPlayer(): number {
        return this.playerInfo1.statsAndInventory.speed >= this.playerInfo2.statsAndInventory.speed ? 1 : 2;
    }

    closeModal() {
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
        defender.statsAndInventory.currentHp = Math.max(0, defender.statsAndInventory.currentHp - 1);
        this.setDisplayText('1 dégat infligé sur ' + defender.name);

        this.isPlayer1Damaged = isDefenderPlayer1;
        this.isPlayer2Damaged = !isDefenderPlayer1;
    }

    attack() {
        const defender = this.currentPlayerTurn === 1 ? this.playerInfo1 : this.playerInfo2;
        const attacker = this.currentPlayerTurn === 1 ? this.playerInfo2 : this.playerInfo1;

        const isDefenderPlayer1 = this.currentPlayerTurn === 1;
        const activeDiceComponent = this.currentPlayerTurn === 1 ? this.diceComponent1 : this.diceComponent2;
        const inactiveDiceComponent = this.currentPlayerTurn === 1 ? this.diceComponent2 : this.diceComponent1;

        console.log(activeDiceComponent.diceValue);

        this.statValue2 =
            this.currentPlayerTurn === 1
                ? activeDiceComponent.diceValue + this.playerInfo1.statsAndInventory.attack
                : inactiveDiceComponent.diceValue + this.playerInfo1.statsAndInventory.defense;
        this.statValue1 =
            this.currentPlayerTurn === 2
                ? activeDiceComponent.diceValue + this.playerInfo2.statsAndInventory.attack
                : inactiveDiceComponent.diceValue + this.playerInfo2.statsAndInventory.defense;

        if (
            activeDiceComponent.diceValue + attacker.statsAndInventory.attack >
            inactiveDiceComponent.diceValue + defender.statsAndInventory.defense
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

            this.playerStat1 = this.playerStat1 === 'Attaque' ? 'Défense' : 'Attaque';
            this.playerStat2 = this.playerStat2 === 'Attaque' ? 'Défense' : 'Attaque';
        }, 1000);

        this.checkIfDuelOver();
    }

    checkIfDuelOver() {
        if (this.playerInfo2.statsAndInventory.currentHp === 0) {
            this.endDuel('Victoire', 'Vous avez gagné le duel');
        } else if (this.playerInfo1.statsAndInventory.currentHp === 0) {
            this.endDuel('Défaite', 'Vous avez perdu le duel');
        }
    }

    endDuel(dialogTitle: string, displayText: string) {
        this.isGameOngoing = false;
        this.triggerTempDialog(dialogTitle);
        this.setDisplayText(displayText);
        setTimeout(() => {
            this.closeModal();
        }, 6000);
    }

    switchTurn() {
        this.currentPlayerTurn = this.currentPlayerTurn === 1 ? 2 : 1;
        const nextPlayer = this.currentPlayerTurn === 1 ? this.playerInfo1.name : this.playerInfo2.name;
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
        const activeDiceComponent = this.currentPlayerTurn === 1 ? this.diceComponent1 : this.diceComponent2;
        activeDiceComponent.rollDice();
        setTimeout(() => {
            this.attack();
        }, 1000);
    }

    triggerTempDialog(message: string) {
        this.temporaryDialogComponent.show(message);
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
