import { Injectable } from '@angular/core';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { Player, PostGameStats } from '@common/player';

export interface Attribute {
  id: number;
  key: keyof Player["postGameStats"];
  displayTxt: string;
  explanations: string;
}

export enum GlobalStat {
  GameDuration = 'gameDuration',
  Turns = 'turn',
  GlobalTilesVisited = 'globalTilesVisited',
  DoorsInteracted = 'doorsInterated',
  FlagBearers = 'flagBearers'
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

  players: Player[] = mockLobbyPlayers;
  // temporary
  initTempStats(){
    for(let i = 0; i < this.players.length; i++){
      this.players[i].postGameStats = this.tempPlayerStats[i];
    }
  }
  // temporary
  tempPlayerStats: PostGameStats[] = [{
    combats: 5,
    victories: 3,
    evasions: 1,
    defeats: 1,
    dmgDealt: 20,
    dmgTaken: 12,
    itemsObtained: 2,
    tilesVisited: 0.78
  },{
    combats: 5,
    victories: 2,
    evasions: 1,
    defeats: 2,
    dmgDealt: 15,
    dmgTaken: 17,
    itemsObtained: 3,
    tilesVisited: 0.82
  },
  {
    combats: 4,
    victories: 1,
    evasions: 2,
    defeats: 1,
    dmgDealt: 14,
    dmgTaken: 11,
    itemsObtained: 2,
    tilesVisited: 0.55,
  },{
    combats: 3,
    victories: 1,
    evasions: 1,
    defeats: 1,
    dmgDealt: 10,
    dmgTaken: 15,
    itemsObtained: 1,
    tilesVisited: 0.67,
  },{
    combats: 3,
    victories: 0,
    evasions: 1,
    defeats: 2,
    dmgDealt: 8,
    dmgTaken: 12,
    itemsObtained: 1,
    tilesVisited: 0.52,
  },{
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

attributes: Attribute[] = [
  {
    id: 0,
    key: 'combats',
    displayTxt: 'Combats',
    explanations: 'Nombre de combats participés par le joueur',
  },
  {
    id: 1,
    key: 'victories',
    displayTxt: 'W/D/L',
    explanations: 'Résultats des combats du joueur sous la forme victoires/évasions/défaites',
  },
  {
    id: 2,
    key: 'dmgDealt',
    displayTxt: 'Dég. infligés',
    explanations: 'Nombre de points de dégats infligés sur les joueurs adverses',
  },
  {
    id: 3,
    key: 'dmgTaken',
    displayTxt: 'Dégats subis',
    explanations: 'Nombre de points de dégats subis pas le joueur',
  },
  {
    id: 4,
    key: 'itemsObtained',
    displayTxt: 'Obj. récup.',
    explanations: "Nombre d'objets ramassés par le joueur au cours de la partie",
  },
  {
    id: 5,
    key: 'tilesVisited',
    displayTxt: '%tuiles visités',
    explanations: 'Pourcentage des tuiles de terrain visités par le joueur',
  },
]

  duration: string = '00:00';
  turns: number = 0;
  visitedTiles: number = 0;
  doorsInteracted: number = 0;
  flagBearers: number = 0;

  constructor() { }

  resetOtherAttributes(attribute: keyof Player["postGameStats"] ){
    Object.keys(this.sortOrder).forEach(key => {
      if (key !== attribute) {
        this.sortOrder[key] = 'unsorted';
      }
    });
  }

  toggleSortOrder(attribute: keyof Player["postGameStats"]){
    if (this.sortOrder[attribute] === 'unsorted' || this.sortOrder[attribute] === 'ascending') {
      this.sortOrder[attribute] = 'descending';
    } else {
      this.sortOrder[attribute] = 'ascending';
    }
  }

  performSorting(attribute: keyof Player["postGameStats"]){
    const isAscending = this.sortOrder[attribute] === 'ascending';

    this.players.sort((a, b) => {
      const valA = a.postGameStats[attribute];;
      const valB = b.postGameStats[attribute];;

      if (valA > valB) return isAscending ? 1 : -1;
      if (valA < valB) return isAscending ? -1 : 1;
      return 0;
    });
  }

  sortPlayers(attribute: keyof Player["postGameStats"]) {
    this.selectedAttribute = attribute;
    this.resetOtherAttributes(attribute);
    this.toggleSortOrder(attribute);
    this.performSorting(attribute);
  }

  updateExplanations(attr: keyof Player["postGameStats"] | ""){
      for(const attribute of this.attributes){
        if(attribute.key === attr){
          this.explanations = attribute.explanations;
          return;
        }
      }
      this.explanations = "";    
  }

  updateExplanationsGlobal(stat: GlobalStat){
    switch (stat){
      case GlobalStat.GameDuration: 
        this.explanations =  "Temps écoulé depuis le début de la partie jusqu'à la finde la partie";
        break;
      case GlobalStat.Turns:
        this.explanations = "Somme des tours de tous les joueurs de cette partie";
        break;
      case GlobalStat.GlobalTilesVisited:
        this.explanations = "Pourcentage des tuiles de terrain visitées par au moins un joueur";
        break;
      case GlobalStat.DoorsInteracted:
        this.explanations = "Pourcentage des portes ayant été manipulées au moins une fois";
        break;
      case GlobalStat.FlagBearers:
        this.explanations = "Nombre de joueurs différents ayant détenu le drapeau (si applicable)";
        break;  
      default:
        this.explanations = '';
    }
  }
}