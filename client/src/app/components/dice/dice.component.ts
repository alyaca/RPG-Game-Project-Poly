import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dice',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dice.component.html',
    styleUrl: './dice.component.scss',
})
export class DiceComponent {
    value: number = 1;
    isRolling: boolean = false;

    rollDice(maxValue: number) {
        if (this.isRolling) return;
        this.isRolling = true;

        const rollDuration = 800;
        const randomDiceValue = Math.floor(Math.random() * maxValue) + 1;

        setTimeout(() => {
            this.value = randomDiceValue;
            this.isRolling = false;
        }, rollDuration);
    }
}
