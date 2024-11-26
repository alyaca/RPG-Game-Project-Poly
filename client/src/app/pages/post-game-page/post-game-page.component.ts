import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlayerStatisticsComponent } from '@app/components/player-statistics/player-statistics.component';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { CommonModule } from '@angular/common';
import { PostGameService } from '@app/services/post-game/post-game.service';
import { PostGameAttributeComponent } from '@app/components/post-game-attribute/post-game-attribute.component';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { defaultGlobalStats } from '@app/mocks/default-global-stats';
import { GameService } from '@app/services/sockets/game/game.service';
import { GlobalPostGameStat } from '@common/global-post-game-stats';
import { GLOBAL_STAT_TYPES } from '@app/constants';
import { SingleGlobalStatComponent } from '@app/components/single-global-stat/single-global-stat.component';

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
        public socketCommunicationService: SocketCommunicationService,
        public navigationService: NavigationService,
        public postGameService: PostGameService,
        public gameService: GameService,
    ) {}

    ngOnInit() {
        this.postGameService.computeStats();
    }

    quitPostGameLobby() {
        this.gameService.onQuitPostGameLobby(this.postGameService.gameRoom.roomId);
    }

    ngOnDestroy() {
        this.postGameService.globalStats = defaultGlobalStats;
        this.socketCommunicationService.disconnect();
    }
}
