import { Component, Input } from '@angular/core';
import { LigmaPlayer } from '@app/services/post-game/post-game.service';
import { CommonModule } from '@angular/common';
import { Status } from '@common/player';
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
  public Status = Status;
  isWinner() {
    return this.player.victories === 3;
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
}
