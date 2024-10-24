import { PlayerStats } from '@common/player';
import { DEFAULT_ACTION_POINT, DEFAULT_ATTRIBUTE } from './constants';

export const defaultAttributes: PlayerStats = {
    totalHp: DEFAULT_ATTRIBUTE,
    currentHp: DEFAULT_ATTRIBUTE,
    speed: DEFAULT_ATTRIBUTE,
    movementPointsLeft: DEFAULT_ACTION_POINT,
    maxActionPoints: DEFAULT_ACTION_POINT,
    actionPoints: DEFAULT_ATTRIBUTE,
    attack: DEFAULT_ATTRIBUTE,
    atkDiceMax: DEFAULT_ATTRIBUTE,
    defense: DEFAULT_ATTRIBUTE,
    defDiceMax: DEFAULT_ATTRIBUTE,
};
