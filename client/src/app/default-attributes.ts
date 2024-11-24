import { PlayerStats } from '@common/player';
import { DEFAULT_ACTION_POINT, DEFAULT_ATTRIBUTE, DEFAULT_EVASION_POINT } from '@app/constants';
export const defaultAttributes: PlayerStats = {
    totalHp: DEFAULT_ATTRIBUTE,
    currentHp: DEFAULT_ATTRIBUTE,
    speed: DEFAULT_ATTRIBUTE,
    movementPointsLeft: DEFAULT_ATTRIBUTE,
    maxActionPoints: DEFAULT_ACTION_POINT,
    actionPoints: DEFAULT_ACTION_POINT,
    attack: DEFAULT_ATTRIBUTE,
    atkDiceMax: DEFAULT_ATTRIBUTE,
    defense: DEFAULT_ATTRIBUTE,
    defDiceMax: DEFAULT_ATTRIBUTE,
    evasion: DEFAULT_EVASION_POINT,
};
