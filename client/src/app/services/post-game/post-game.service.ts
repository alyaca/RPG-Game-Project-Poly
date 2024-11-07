import { Injectable } from '@angular/core';

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
  isActive: boolean
}

@Injectable({
  providedIn: 'root'
})
export class PostGameService {
  explanations: string = '';
  selectedAttribute: string = '';
  sortOrder: { [key: string]: 'ascending' | 'descending' | 'unsorted' } = {
    combats: 'unsorted',
    victories: 'unsorted',
    evasions: 'unsorted',
    defeats: 'unsorted',
    dmgDealt: 'unsorted',
    dmgTaken: 'unsorted',
    itemsObtained: 'unsorted',
    tilesVisited: 'unsorted'
  };
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
    isActive: true
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
    isActive: false
  },
  {
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
    isActive: false
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
    isActive: false
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
    isActive: false
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
    isActive: false
  }
]

  duration: string = '00:00';
  turns: number = 0;
  visitedTiles: number = 0;
  doorsInteracted: number = 0;
  flagBearers: number = 0;

  constructor() { }

  resetOtherAttributes(attribute: keyof LigmaPlayer){
    Object.keys(this.sortOrder).forEach(key => {
      if (key !== attribute) {
        this.sortOrder[key] = 'unsorted';
      }
    });
  }

  toggleSortOrder(attribute: keyof LigmaPlayer){
    if (this.sortOrder[attribute] === 'unsorted' || this.sortOrder[attribute] === 'ascending') {
      this.sortOrder[attribute] = 'descending';
    } else {
      this.sortOrder[attribute] = 'ascending';
    }
  }

  performSorting(attribute: keyof LigmaPlayer){
    const isAscending = this.sortOrder[attribute] === 'ascending';

    this.players.sort((a, b) => {
      const valA = a[attribute];
      const valB = b[attribute];

      if (valA > valB) return isAscending ? 1 : -1;
      if (valA < valB) return isAscending ? -1 : 1;
      return 0;
    });
  }

  sortPlayers(attribute: keyof LigmaPlayer) {
    this.selectedAttribute = attribute;
    this.resetOtherAttributes(attribute);
    this.toggleSortOrder(attribute);
    this.performSorting(attribute);
  }

  updateExplanations(attribute: string){
    switch(attribute){
      case 'combats':
        this.explanations = 'Nombre de combats participés par le joueur';
        break;
      case 'records':
        this.explanations = 'Résultats des combats du joueur sous la forme victoires/évasions/défaites';
        break;
      case 'dmgDealt':
        this.explanations = 'Nombre de points de dégats infligés sur les joueurs adverses';
        break;
      case 'dmgTaken':
        this.explanations = 'Nombre de points de dégats subis pas le joueur';
        break;
      case 'itemsObtained':
        this.explanations = "Nombre d'objets ramassés par le joueur au cours de la partie";
        break;
      case 'tilesVisited':
        this.explanations = 'Pourcentage des tuiles de terrain visités par le joueur';
        break;
      case 'gameDuration':
        this.explanations = "Temps écoulé depuis le début de la partie jusqu'à la finde la partie";
        break;
      case 'turns':
        this.explanations = "Somme des tours de tous les joueurs de cette partie";
        break;
      case 'globalTilesVisited':
        this.explanations = "Pourcentage des tuiles de terrain visitées par au moins un joueur";
        break;
      case 'doorsInteracted':
        this.explanations = "Pourcentage des portes ayant été manipulées au moins une fois";
        break;
      case 'flagBearers':
        this.explanations = "Nombre de joueurs différents ayant détenu le drapeau (si applicable)";
        break;      
      default:
        this.explanations = '';
        break;
    }
  }
}
