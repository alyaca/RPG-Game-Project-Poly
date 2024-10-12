import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { PlayerInfo } from '@app/interfaces/playerInfo';
import { TimerComponent } from '../timer/timer.component';
import { DiceComponent } from '../dice/dice.component';
import { CommonModule } from '@angular/common';
import { SimpleDialogComponent } from '../simple-dialog/simple-dialog.component';
import { TemporaryDialogComponent } from '../temporary-dialog/temporary-dialog.component';
import { CombatStatsBarComponent } from '@app/components/combat-stats-bar/combat-stats-bar.component';

@Component({
    selector: 'app-combat-modal',
    standalone: true,
    imports: [TimerComponent, DiceComponent, CommonModule, SimpleDialogComponent, TemporaryDialogComponent, CombatStatsBarComponent],
    templateUrl: './combat-modal.component.html',
    styleUrl: './combat-modal.component.scss',
})
export class CombatModalComponent {
    @Input() isInCombat = false;
    @Output() close = new EventEmitter<void>();
    @ViewChild('dice') diceComponent!: DiceComponent;
    @ViewChild('timer') timerComponent!: TimerComponent;
    @ViewChild('temporaryDialog') temporaryDialogComponent!: TemporaryDialogComponent;
    //@ViewChild('combatStatsBar') combatStatsBar!: CombatModalComponent;

    @Input() playerInfo1: PlayerInfo = {
        name: 'Jar Jar Binks',
        portrait: '/assets/images/characters/Hephaestus.webp/',
        hp: 6,
        currentHp: 6,
        speed: 4,
        maxActionPoints: 2,
        actionPoints: 1,
        movementPointsLeft: 3,
        evasionsLeft: 2,
        attack: 4,
        atkDice: 6,
        defense: 4,
        defDice: 4,
        inventory: [],
    };

    @Input() playerInfo2: PlayerInfo = {
        name: 'Leia Organa',
        portrait: '/assets/images/characters/Artemis.webp/',
        hp: 6,
        currentHp: 6,
        speed: 5,
        maxActionPoints: 2,
        actionPoints: 1,
        movementPointsLeft: 3,
        evasionsLeft: 1,
        attack: 6,
        atkDice: 6,
        defense: 4,
        defDice: 4,
        inventory: [],
    };

    isPlayer1Damaged: boolean = false;
    isPlayer2Damaged: boolean = false;
    //isDamaged: boolean = false;
    evasionsArray = new Array(this.playerInfo1.evasionsLeft).fill(1);
    displayText: string = '';

    currentPlayerTurn: number = 1;

    closeModal() {
        this.isInCombat = false;
        this.close.emit();
    }

    triggerRollDice() {
        this.diceComponent.rollDice();
    }

    setDisplayText(text: string) {
        this.displayText = '';
        setTimeout(() => {
            this.displayText = text;
        }, 300);
    }

    dealDamage(defender: PlayerInfo, isDefenderPlayer1: boolean) {
        defender.currentHp = Math.max(0, defender.currentHp - 1);
        this.setDisplayText('1 dégat infligé à ' + defender.name);
        //this.isDamaged = true;

          if (isDefenderPlayer1) {
            this.isPlayer1Damaged = true;
            this.isPlayer2Damaged = false;
        } else {
            this.isPlayer2Damaged = true;
            this.isPlayer1Damaged = false;
        }
    }

    attack() {
        const defender = this.currentPlayerTurn === 1 ? this.playerInfo1 : this.playerInfo2;
        const attacker = this.currentPlayerTurn === 1 ? this.playerInfo2 : this.playerInfo1;
        const isDefenderPlayer1 = this.currentPlayerTurn === 1;

        if (attacker.attack + this.diceComponent.diceValue > defender.defense){
        console.log(this.diceComponent.diceValue);
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
        }, 1000);


        this.checkIfDuelOver(attacker, defender);
    }

    checkIfDuelOver(attacker: PlayerInfo, defender: PlayerInfo){
      if (attacker.currentHp === 0 || defender.currentHp === 0) {
        this.triggerTempDialog('Victoire');
        this.setDisplayText('Vous avez gagné le duel');
        setTimeout(() => {
              this.closeModal();
          }, 6000);
      }
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

        if (this.evasionsArray.length === 0) {
            this.setDisplayText("Évasion pas possible, vous n'avez plus d'évasions restantes");
            return;
        }

        this.evasionsArray.pop();
        if (Math.random() < 0.4) {
            this.triggerTempDialog('Évasion réussie, partie nulle');
            setTimeout(() => {
                this.closeModal();
            }, 3000);
        } else {
            this.setDisplayText('Évasion échouée');
        }
    }

    triggerAttack() {
        setTimeout(() => {
            this.attack();
        }, 1000);
        this.switchTurn();
    }

    triggerTempDialog(message: string) {
        this.temporaryDialogComponent.show(message);
    }

    onTimerFinished() {
        this.switchTurn();
        this.attack();
    }
}
