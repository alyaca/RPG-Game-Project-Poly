import { Component } from '@angular/core';
import { PlayerStatisticsComponent } from '@app/components/player-statistics/player-statistics.component';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { RouterLink } from '@angular/router';
export interface LigmaPlayer {
  id: string,
  name: string,
  avatar: string,
  combats: number,
  victories: number,
  evasions: number,
  defeats: number,
  dmgDealt: number,
  dmgTaken: number,
  itemsObtained: number,
  tilesVisited: number,
}

@Component({
  selector: 'app-post-game-page',
  standalone: true,
  imports: [PlayerStatisticsComponent, ChatBoxComponent, RouterLink],
  templateUrl: './post-game-page.component.html',
  styleUrl: './post-game-page.component.scss'
})
export class PostGamePageComponent {

  // temporary
  players: LigmaPlayer[] = [{
    id: '0',
    name: 'Joe Biden',
    avatar: './assets/images/characters/Hermes.webp',
    combats: 5,
    victories: 3,
    evasions: 1,
    defeats: 1,
    dmgDealt: 20,
    dmgTaken: 12,
    itemsObtained: 2,
    tilesVisited: 0.78,
  },{
    id: '0',
    name: 'Donald Trump',
    avatar: './assets/images/characters/Athena.webp',
    combats: 5,
    victories: 2,
    evasions: 1,
    defeats: 2,
    dmgDealt: 15,
    dmgTaken: 17,
    itemsObtained: 3,
    tilesVisited: 0.82,
  },{
    id: '0',
    name: 'Barack Obama',
    avatar: './assets/images/characters/Apollo.webp',
    combats: 4,
    victories: 1,
    evasions: 2,
    defeats: 1,
    dmgDealt: 14,
    dmgTaken: 11,
    itemsObtained: 2,
    tilesVisited: 0.55,
  },{
    id: '0',
    name: 'George W. Bush',
    avatar: './assets/images/characters/Poseidon.webp',
    combats: 3,
    victories: 1,
    evasions: 1,
    defeats: 1,
    dmgDealt: 10,
    dmgTaken: 15,
    itemsObtained: 1,
    tilesVisited: 0.67,
  },{
    id: '0',
    name: 'Bill Clinton',
    avatar: './assets/images/characters/Hephaestus.webp',
    combats: 3,
    victories: 0,
    evasions: 1,
    defeats: 2,
    dmgDealt: 8,
    dmgTaken: 12,
    itemsObtained: 1,
    tilesVisited: 0.52,
  },{
    id: '0',
    name: 'George H. W. Bush',
    avatar: './assets/images/characters/Artemis.webp',
    combats: 2,
    victories: 0,
    evasions: 1,
    defeats: 1,
    dmgDealt: 5,
    dmgTaken: 8,
    itemsObtained: 0,
    tilesVisited: 0.42,
  }
]

  duration: string = '00:00:00';
  turns: number = 0;
  visitedTiles: number = 0;
  doorsInteracted: number = 0;
  flagBearers: number = 0;
}
