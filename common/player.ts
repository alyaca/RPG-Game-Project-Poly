import { defaultAttributes } from './default-attributes';
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

export enum Behavior {
    Sentient = 'sentient',
    Aggressive = 'aggressive',
    Defensive = 'defensive'
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
    position: { x: number; y: number };
    behavior: Behavior;
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

export interface Position {
    x: number;
    y: number;
}

export const baseBot: Player = {
    id: '0',
    avatar: { name: 'a', src:'', isSelected: true, isTaken: true},
    status: Status.Bot,
    name: 'Joueur virtuel',
    victories: 0,
    isActive: false,
    attributes: defaultAttributes,
    inventory: [],
    position: { x: 0, y: 0 },
    behavior: Behavior.Sentient
};