import { Component, Input } from '@angular/core';
// import { LigmaPlayer } from '@app/services/post-game/post-game.service';
import { CommonModule } from '@angular/common';
import { Player, Status } from '@common/player';
import { PostGameService } from '@app/services/post-game/post-game.service';
@Component({
  selector: 'app-player-statistics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './player-statistics.component.html',
  styleUrl: './player-statistics.component.scss'
})
export class PlayerStatisticsComponent {
  @Input() player: Player;
  @Input() selectedAttribute: string;
  public Status = Status;

  constructor(private postGameService: PostGameService){}

  isWinner() {
    return this.player.postGameStats.victories === 3;
  }
  getStatusClass(): string {
    switch (this.player.status) {
      case Status.Disconnected:
        return 'status-disconnected';
      case Status.Admin:
        return 'status-admin';
      case Status.Bot:
        return 'status-bot';
      default:
        return '';
    }
  }

  

  getBarWidth(attribute: number, statKey: keyof Player["postGameStats"], isPercent: boolean): number {
    const max = isPercent ? 100 : this.postGameService.getMaxStat(statKey);
    return Math.min(((attribute)/max)*100, 100);
  }
}
