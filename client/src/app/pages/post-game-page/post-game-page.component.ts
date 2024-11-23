import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlayerStatisticsComponent } from '@app/components/player-statistics/player-statistics.component';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostGameService } from '@app/services/post-game/post-game.service';
import { PostGameAttributeComponent } from '@app/components/post-game-attribute/post-game-attribute.component';
import { StopwatchService } from '@app/services/stopwatch/stopwatch.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { NavigationService } from '@app/services/navigation/navigation.service';

@Component({
  selector: 'app-post-game-page',
  standalone: true,
  imports: [PlayerStatisticsComponent, ChatBoxComponent, RouterLink, CommonModule, PostGameAttributeComponent],
  templateUrl: './post-game-page.component.html',
  styleUrl: './post-game-page.component.scss'
})
export class PostGamePageComponent implements OnInit, OnDestroy{
  constructor(public socketCommunicationService: SocketCommunicationService, public navigationService: NavigationService, public postGameService: PostGameService, public stopwatchService: StopwatchService){}

  ngOnInit(){
    this.postGameService.globalStats.gameDuration = this.stopwatchService.getTime();
    this.postGameService.computeStats();
  }

  ngOnDestroy(){
    this.socketCommunicationService.disconnect();
  }
}
