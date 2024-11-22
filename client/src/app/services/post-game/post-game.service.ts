import { Injectable } from '@angular/core';
// import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { Player, PostGameStats } from '@common/player';
import { GlobalPostGameStats } from '@common/global-post-game-stats';
import { NavigationService } from '../navigation/navigation.service';
import { TileType } from '@app/constants';

export interface Attribute {
  id: number;
  key: keyof Player["postGameStats"];
  displayTxt: string;
  explanations: string;
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

  globalStats: GlobalPostGameStats = {
    gameDuration: '00:00',
    turns: 0,
    globalTilesVisited: 0,
    doorsInteracted: 0,
    nbFlagBearers: 0,
  };

  players: Player[];
  tilesGrid: number[][];
  // temporary
  initTempStats(){
    // for(let i = 0; i < this.players.length; i++){
    //   this.players[i].postGameStats = this.tempPlayerStats[i];
    // }
    // this.globalStats = {
    //   gameDuration: '00:00',
    //   turns: 16,
    //   globalTilesVisited: 30,
    //   doorsInteracted: 50,
    //   nbFlagBearers: 0,
    // }
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
    tilesVisited: 78.2
  },{
    combats: 5,
    victories: 2,
    evasions: 1,
    defeats: 2,
    dmgDealt: 15,
    dmgTaken: 17,
    itemsObtained: 3,
    tilesVisited: 82.5
  },
  {
    combats: 4,
    victories: 1,
    evasions: 2,
    defeats: 1,
    dmgDealt: 14,
    dmgTaken: 11,
    itemsObtained: 2,
    tilesVisited: 55.1,
  },{
    combats: 3,
    victories: 1,
    evasions: 1,
    defeats: 1,
    dmgDealt: 10,
    dmgTaken: 15,
    itemsObtained: 1,
    tilesVisited: 67.0,
  },{
    combats: 3,
    victories: 0,
    evasions: 1,
    defeats: 2,
    dmgDealt: 8,
    dmgTaken: 12,
    itemsObtained: 1,
    tilesVisited: 52.4,
  },{
    combats: 2,
    victories: 0,
    evasions: 1,
    defeats: 1,
    dmgDealt: 5,
    dmgTaken: 8,
    itemsObtained: 0,
    tilesVisited: 42.8,
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
    explanations: "Nombre d'objets distincts ramassés par le joueur au cours de la partie",
  },
  {
    id: 5,
    key: 'tilesVisited',
    displayTxt: '%tuiles visités',
    explanations: 'Pourcentage des tuiles de terrain visités par le joueur',
  },
]

  constructor(public navigationService: NavigationService) { }

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

  updateExplanationsGlobal(stat: keyof  GlobalPostGameStats){
    switch (stat){
      case "gameDuration": 
        this.explanations =  "Temps écoulé depuis le début de la partie jusqu'à la fin de la partie";
        break;
      case "turns":
        this.explanations = "Somme des tours de tous les joueurs de cette partie";
        break;
      case "globalTilesVisited":
        this.explanations = "Pourcentage des tuiles de terrain visitées par au moins un joueur";
        break;
      case "doorsInteracted":
        this.explanations = "Pourcentage des portes ayant été manipulées au moins une fois";
        break;
      case "nbFlagBearers":
        this.explanations = "Nombre de joueurs différents ayant détenu le drapeau (si applicable)";
        break;  
      default:
        this.explanations = '';
    }
  }

  getMaxStat(statKey: keyof Player["postGameStats"]): number {
    return Math.max(...this.players.map(player => player.postGameStats[statKey]));
  }

  public findTotalTerrainTiles(): number {
    let totalTerrainTiles: number = 0;
      for(let i = 0; i < this.tilesGrid.length; i++){
        for(let j = 0; j < this.tilesGrid[0].length; j++){
            if(this.tilesGrid[i][j] < TileType.Wall){
                totalTerrainTiles++;
            }
        }
    }
    return totalTerrainTiles;
}
}