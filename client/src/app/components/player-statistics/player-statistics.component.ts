import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '@common/player';
import { PostGameService } from '@app/services/post-game/post-game.service';
import { TOTAL_PERCENTAGE, VICTORIES_FOR_WIN } from '@app/constants';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
@Component({
    selector: 'app-player-statistics',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './player-statistics.component.html',
    styleUrl: './player-statistics.component.scss',
})
export class PlayerStatisticsComponent {
    @Input() player: Player;
    @Input() selectedAttribute: string;

    constructor(
        private postGameService: PostGameService,
        public socketCommunicationService: SocketCommunicationService,
    ) {}

    isWinner() {
        return this.player.postGameStats.victories === VICTORIES_FOR_WIN;
    }

    getStatusClass(): string {
        return this.player.status;
    }

    getBarWidth(attribute: number, statKey: keyof Player['postGameStats'], isPercent: boolean): number {
        const max = isPercent ? TOTAL_PERCENTAGE : this.postGameService.getMaxStat(statKey);
        return Math.min((attribute / max) * TOTAL_PERCENTAGE, TOTAL_PERCENTAGE);
    }
}
