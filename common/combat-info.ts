import { CombatPlayers } from './combat-player';
import { Room } from './room';

export interface CombatInfos {
    combatPlayers: CombatPlayers;
    gameTime: number;
    room: Room;
}
