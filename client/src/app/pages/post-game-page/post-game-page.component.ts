import { Component } from '@angular/core';
import { PlayerStatisticsComponent } from '@app/components/player-statistics/player-statistics.component';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostGameService } from '@app/services/post-game/post-game.service';

@Component({
  selector: 'app-post-game-page',
  standalone: true,
  imports: [PlayerStatisticsComponent, ChatBoxComponent, RouterLink, CommonModule],
  templateUrl: './post-game-page.component.html',
  styleUrl: './post-game-page.component.scss'
})
export class PostGamePageComponent {
  constructor(public postGameService: PostGameService){}
}
