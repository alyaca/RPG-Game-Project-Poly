import { GameObject } from '@app/interfaces/gameObject';

export interface PlayerInfo {
    portrait: string;
    name: string;
    hp: number;
    currentHp: number;
    speed: number;
    movementPointsLeft: number;
    maxActionPoints: number;
    actionPoints: number;
    attack: number;
    atkDice: number;
    defense: number;
    defDice: number;
    inventory: GameObject[];
}
