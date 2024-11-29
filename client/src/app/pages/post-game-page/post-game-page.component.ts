import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { PlayerStatisticsComponent } from '@app/components/player-statistics/player-statistics.component';
import { PostGameAttributeComponent } from '@app/components/post-game-attribute/post-game-attribute.component';
import { SingleGlobalStatComponent } from '@app/components/single-global-stat/single-global-stat.component';
import { GLOBAL_STAT_TYPES } from '@app/constants';
import { defaultGlobalStats } from '@app/mocks/default-global-stats';
import { PostGameService } from '@app/services/post-game/post-game.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { GlobalPostGameStat } from '@common/interfaces/global-post-game-stats';

@Component({
    selector: 'app-post-game-page',
    standalone: true,
    imports: [PlayerStatisticsComponent, ChatBoxComponent, CommonModule, PostGameAttributeComponent, SingleGlobalStatComponent],
    templateUrl: './post-game-page.component.html',
    styleUrl: './post-game-page.component.scss',
})
export class PostGamePageComponent implements OnInit, OnDestroy {
    globalStats: GlobalPostGameStat[] = GLOBAL_STAT_TYPES;

    constructor(
        private socketCommunicationService: SocketCommunicationService,
        public postGameService: PostGameService,
        private gameService: GameService,
    ) {}

    ngOnInit() {
        this.postGameService.computeStats();
    }

    quitPostGameLobby() {
        this.gameService.onQuitPostGameLobby(this.postGameService.gameRoom.roomId);
    }

    getPostGameStatTypes() {
        return this.postGameService.postGameStatTypes;
    }

    getPlayers() {
        return this.postGameService.players;
    }

    getCtfMode() {
        return this.postGameService.isCTFMode;
    }

    getSelectedAttribute() {
        return this.postGameService.selectedAttribute;
    }

    getExplanations() {
        return this.postGameService.explanations;
    }

    ngOnDestroy() {
        this.postGameService.globalStats = defaultGlobalStats;
        this.socketCommunicationService.disconnect();
    }
}
