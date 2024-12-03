import { GameObject } from '@common/interfaces/game-object';

export interface Avatar {
    id?: number;
    name: string;
    src: string;
    isSelected?: boolean;
    isTaken?: boolean;
}

export enum Status {
    Player = 'regular-player',
    Admin = 'admin',
    Bot = 'bot',
    Disconnected = 'disconnected',
    PendingDisconnection = 'pendingDisconnection',
}

export enum Behavior {
    Sentient = 'sentient',
    Aggressive = 'aggressive',
    Defensive = 'defensive',
}

export interface Player {
    id: string;
    attributes: Attributes;
    avatar?: Avatar;
    isActive: boolean;
    name: string;
    status: Status;
    postGameStats: PostGameStats;
    inventory: GameObject[];
    position: Position;
    positionHistory: Position[];
    collectedItems?: number[];
    spawnPosition: Position;
    behavior: Behavior;
}

export interface Attributes {
    totalHp: number;
    currentHp: number;
    speed: number;
    movementPointsLeft: number;
    maxActionPoints: number;
    actionPoints: number;
    attack: number;
    atkDiceMax: number;
    defense: number;
    defDiceMax: number;
    evasion: number;
}

export interface PostGameStats {
    combats: number;
    victories: number;
    evasions: number;
    defeats: number;
    damageDealt: number;
    damageTaken: number;
    itemsObtained: number;
    tilesVisited: number;
}

export interface Position {
    x: number;
    y: number;
}
