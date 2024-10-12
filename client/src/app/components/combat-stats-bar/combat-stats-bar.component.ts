import { Component, Input } from '@angular/core';
import { PlayerInfo } from '@app/interfaces/playerInfo';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-combat-stats-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './combat-stats-bar.component.html',
  styleUrl: './combat-stats-bar.component.scss'
})
export class CombatStatsBarComponent {
  @Input() playerInfo: PlayerInfo;
  @Input() isOnRightSide: boolean;
  @Input() isDamaged: boolean;
}
