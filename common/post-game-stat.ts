import { Player } from './player';

// to see if its useful or not
export enum PlayerStatType {
    Combats = 'combats',
    Victories = 'victories',
    Evasions = 'evasions',
    Defeats = 'defeats',
    DmgDealt = 'dmgDealt',
    DmgTaken = 'dmgTaken',
    ItemsObtained = 'itemsObtained',
    TilesVisited = 'tilesVisited'
}

export interface PostGameStat {
    id: number;
    key: keyof Player['postGameStats'];
    displayTxt: string;
    explanations: string;
}