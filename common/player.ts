import { GameObject } from '@common/gameObject';
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
    attributes: string;
    avatar: Avatar;
    isActive: boolean;
    name: string;
    status: Status;
    victories: number;
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
    inventory?: GameObject[];
}
