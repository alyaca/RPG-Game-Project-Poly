import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PlayerInfo } from '@app/interfaces/playerInfo';
import { TimerComponent } from '../timer/timer.component';


@Component({
  selector: 'app-combat-modal',
  standalone: true,
  imports: [TimerComponent],
  templateUrl: './combat-modal.component.html',
  styleUrl: './combat-modal.component.scss'
})
export class CombatModalComponent {
  @Input() isInCombat = false;
  @Output() close = new EventEmitter<void>();
  


  @Input() playerInfo1: PlayerInfo = {
    name: 'Jar Jar Binks',
    portrait: '/assets/images/characters/Hephaestus.webp/',
    hp: 6,
    currentHp: 4,
    speed: 4,
    maxActionPoints: 2,
    actionPoints: 1,
    movementPointsLeft: 3,
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
    currentHp: 2,
    speed: 5,
    maxActionPoints: 2,
    actionPoints: 1,
    movementPointsLeft: 3,
    attack: 6,
    atkDice: 6,
    defense: 4,
    defDice: 4,
    inventory: [],
};


  closeModal() {
    this.isInCombat = false;
    this.close.emit();
  }
}
