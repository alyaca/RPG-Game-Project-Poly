import { Player } from './player';

export enum PlayerStatType {
    Combats = 'combats',
    Victories = 'victories',
    Evasions = 'evasions',
    Defeats = 'defeats',
    DamageDealt = 'damageDealt',
    DamageTaken = 'damageTaken',
    ItemsObtained = 'itemsObtained',
    TilesVisited = 'tilesVisited',
}

export interface PostGameStat {
    id: number;
    key: keyof Player['postGameStats'];
    displayText: string;
    explanations: string;
}
