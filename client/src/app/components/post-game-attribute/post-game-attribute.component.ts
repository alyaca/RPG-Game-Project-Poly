import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SortOrder } from '@app/constants';
import { PostGameService } from '@app/services/post-game/post-game.service';
import { Player } from '@common/interfaces/player';

@Component({
    selector: 'app-post-game-attribute',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './post-game-attribute.component.html',
    styleUrl: './post-game-attribute.component.scss',
})
export class PostGameAttributeComponent {
    @Input() attribute: keyof Player['postGameStats'];
    @Input() displayText: string;
    sortOrder = SortOrder;
    constructor(public postGameService: PostGameService) {}

    getSortClass(playerStatType: string) {
        return this.postGameService.sortOrder[playerStatType];
    }
}
