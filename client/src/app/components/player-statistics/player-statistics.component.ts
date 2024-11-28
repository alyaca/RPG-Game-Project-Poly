import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '@common/player';
import { PLAYER_STAT_TYPES, VICTORIES_FOR_WIN } from '@app/constants';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { SinglePlayerStatComponent } from '@app/components/single-player-stat/single-player-stat.component';
import { PostGameStat } from '@common/post-game-stat';
@Component({
    selector: 'app-player-statistics',
    standalone: true,
    imports: [CommonModule, SinglePlayerStatComponent],
    templateUrl: './player-statistics.component.html',
    styleUrl: './player-statistics.component.scss',
})
export class PlayerStatisticsComponent {
    @Input() player: Player;
    @Input() selectedAttribute: string;
    playerStatTypes: PostGameStat[] = PLAYER_STAT_TYPES;

    constructor(private socketCommunicationService: SocketCommunicationService) {}

    isWinner() {
        return this.player.postGameStats.victories === VICTORIES_FOR_WIN;
    }

    getStatusClass(): string {
        return this.player.status;
    }

    getSocketId() {
        return this.socketCommunicationService.socket?.id;
    }
}
