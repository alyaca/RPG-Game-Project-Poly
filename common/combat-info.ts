import { Player } from './player';
import { Roles } from './roles';

export interface CombatInfo {
    isPlayer1Damaged: boolean;
    isPlayer2Damaged: boolean;
    statValue1: number;
    statValue2: number;

    displayText: string;
    isGameOngoing: boolean;

    currPlayerNum: string;

    evasionsArray1: number[];
    evasionsArray2: number[];
    playerStat1: string;
    playerStat2: string;
    roles: Roles;
    isDraw: boolean;

    attackInProgress: boolean;
    player1: Player;
    player2: Player;
}
