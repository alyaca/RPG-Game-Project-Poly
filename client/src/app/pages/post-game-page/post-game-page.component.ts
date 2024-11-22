import { Component } from '@angular/core';
import { PlayerStatisticsComponent } from '@app/components/player-statistics/player-statistics.component';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostGameService } from '@app/services/post-game/post-game.service';
import { PostGameAttributeComponent } from '@app/components/post-game-attribute/post-game-attribute.component';
import { StopwatchService } from '@app/services/stopwatch/stopwatch.service';


@Component({
  selector: 'app-post-game-page',
  standalone: true,
  imports: [PlayerStatisticsComponent, ChatBoxComponent, RouterLink, CommonModule, PostGameAttributeComponent],
  templateUrl: './post-game-page.component.html',
  styleUrl: './post-game-page.component.scss'
})
export class PostGamePageComponent {
  constructor(public postGameService: PostGameService, public stopwatchService: StopwatchService){
    this.postGameService.initTempStats(); // Temporary
    this.postGameService.globalStats.gameDuration = '0';
    this.stopwatchService.start();
  }

  stopStopwatch() {
    this.postGameService.globalStats.gameDuration = this.stopwatchService.stop();
  }


  // case 'combats':
  //   this.explanations = 'Nombre de combats participés par le joueur';
  //   break;
  // case 'records':
  //   this.explanations = 'Résultats des combats du joueur sous la forme victoires/évasions/défaites';
  //   break;
  // case 'dmgDealt':
  //   this.explanations = 'Nombre de points de dégats infligés sur les joueurs adverses';
  //   break;
  // case 'dmgTaken':
  //   this.explanations = 'Nombre de points de dégats subis pas le joueur';
  //   break;
  // case 'itemsObtained':
  //   this.explanations = "Nombre d'objets ramassés par le joueur au cours de la partie";
  //   break;
  // case 'tilesVisited':
  //   this.explanations = 'Pourcentage des tuiles de terrain visités par le joueur';
  //   break;
}
