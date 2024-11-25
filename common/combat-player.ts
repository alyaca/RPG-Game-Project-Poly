import { CombatResultDetails } from './combat-result';
import { Player } from './player';
export interface CombatPlayers {
    attacker: Player;
    defender: Player;
    combatResultDetails?: CombatResultDetails;
}
