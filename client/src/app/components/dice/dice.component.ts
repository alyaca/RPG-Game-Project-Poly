import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dice.component.html',
  styleUrl: './dice.component.scss'
})
export class DiceComponent {
  diceValue: number = 1;
  isRolling: boolean = false;

  rollDice(): void {
    if (this.isRolling) return;
    this.isRolling = true;

    const rollDuration = 800; 
    const randomDiceValue = Math.floor(Math.random() * 6) + 1;

    setTimeout(() => {
      this.diceValue = randomDiceValue;
      this.isRolling = false;
    }, rollDuration);
  }
}