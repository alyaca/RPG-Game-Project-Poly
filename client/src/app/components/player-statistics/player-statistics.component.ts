import { Component, Input } from '@angular/core';
import { LigmaPlayer } from '@app/pages/post-game-page/post-game-page.component';


@Component({
  selector: 'app-player-statistics',
  standalone: true,
  imports: [],
  templateUrl: './player-statistics.component.html',
  styleUrl: './player-statistics.component.scss'
})
export class PlayerStatisticsComponent {
  @Input() player: LigmaPlayer;
}
