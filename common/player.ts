import { GameObject } from '@common/game-object';
export interface Avatar {
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
}

export interface Player {
    id: string;
    attributes: PlayerStats;
    avatar?: Avatar;
    isActive: boolean;
    name: string;
    status: Status;
    victories: number;
    inventory?: GameObject[];
}

export interface PlayerStats {
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
}
