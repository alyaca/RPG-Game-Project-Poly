import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PostGameService } from '@app/services/post-game/post-game.service';
import { Player } from '@common/player';
import { TOTAL_PERCENTAGE } from '@app/constants';
import { PlayerStatType } from '@common/post-game-stat';

@Component({
    selector: 'app-single-player-stat',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './single-player-stat.component.html',
    styleUrl: './single-player-stat.component.scss',
})
export class SinglePlayerStatComponent {
    @Input() player: Player;
    @Input() selectedAttribute: string;
    @Input() attribute: string;

    constructor(public postGameService: PostGameService) {}

    getStatValue(): number {
        return this.player?.postGameStats[this.attribute as keyof Player['postGameStats']] ?? -1;
    }

    formatStatValue() {
        const formattedStat = this.getStatValue().toString();
        return this.attribute === PlayerStatType.TilesVisited ? formattedStat + '%' : formattedStat;
    }

    getAttrKey() {
        return this.attribute as keyof Player['postGameStats'];
    }

    isRecord(): boolean {
        return this.attribute === PlayerStatType.Victories;
    }

    hasBar(): boolean {
        return [PlayerStatType.DmgDealt as string, PlayerStatType.DmgTaken as string, PlayerStatType.TilesVisited as string].includes(this.attribute);
    }

    isPercent(): boolean {
        return this.attribute === PlayerStatType.TilesVisited;
    }

    getBarWidth(attribute: number, statKey: keyof Player['postGameStats'], isPercent: boolean): number {
        const max = isPercent ? TOTAL_PERCENTAGE : this.postGameService.getMaxStat(statKey);
        return Math.min((attribute / max) * TOTAL_PERCENTAGE, TOTAL_PERCENTAGE);
    }
}
