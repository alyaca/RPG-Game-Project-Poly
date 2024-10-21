import { GameObject } from '@app/interfaces/gameObject';

export enum Status {
    Player = 'regular-player',
    Admin = 'admin',
    Bot = 'bot',
    Disconnected = 'disconnected',
}

export interface PlayerObjects {
    id: number;
    avatar: string;
    status: Status;
    name: string;
    victories: number;
    isActive: boolean;
    attributes: PlayerStats;
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
    inventory: GameObject[];
}
