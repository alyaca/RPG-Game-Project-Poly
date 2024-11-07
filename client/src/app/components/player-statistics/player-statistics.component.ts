import { Component, Input } from '@angular/core';
import { LigmaPlayer } from '@app/services/post-game/post-game.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-player-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-statistics.component.html',
  styleUrl: './player-statistics.component.scss'
})
export class PlayerStatisticsComponent {
  @Input() player: LigmaPlayer;
  @Input() selectedAttribute: string;
  // getCombatRecord(){
  //   return this.player.victories.toString() + '/' + this.player.evasions.toString() + '/' + this.player.defeats.toString()
  // }
}
