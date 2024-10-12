import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { PlayerInfo } from '@app/interfaces/playerInfo';
import { TimerComponent } from '../timer/timer.component';
import { DiceComponent } from '../dice/dice.component';
import { CommonModule } from '@angular/common';
import { SimpleDialogComponent } from '../simple-dialog/simple-dialog.component';

@Component({
    selector: 'app-combat-modal',
    standalone: true,
    imports: [TimerComponent, DiceComponent, CommonModule, SimpleDialogComponent],
    templateUrl: './combat-modal.component.html',
    styleUrl: './combat-modal.component.scss',
})
export class CombatModalComponent {
    @Input() isInCombat = false;
    @Output() close = new EventEmitter<void>();
    @ViewChild('dice') diceComponent!: DiceComponent;
    @ViewChild('timer') timerComponent!: TimerComponent;

    @Input() playerInfo1: PlayerInfo = {
        name: 'Jar Jar Binks',
        portrait: '/assets/images/characters/Hephaestus.webp/',
        hp: 6,
        currentHp: 4,
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

    isDamaged: boolean = false;
    evasionsArray = new Array(this.playerInfo1.evasionsLeft).fill(1);

    closeModal() {
        this.isInCombat = false;
        this.close.emit();
    }

    triggerRollDice() {
        this.diceComponent.rollDice();
    }

    attack() {
        this.playerInfo2.currentHp = Math.max(0, this.playerInfo2.currentHp - 1);

        this.isDamaged = true;
        this.timerComponent.resetTimer();
        setTimeout(() => {
            this.isDamaged = false;
        }, 500);

        if(this.playerInfo1.currentHp === 0 || this.playerInfo2.currentHp === 0){
            setTimeout(() => {
              this.closeModal();
          }, 3000); 
        }
    }

    triggerEvade() {
      this.evasionsArray.pop();
    }


    triggerAttack() {
        setTimeout(() => {
            this.attack();
        }, 1000);
    }
}
