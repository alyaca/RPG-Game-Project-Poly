import { Player } from './player'

export type Roles = {
    [key: string]: {
        attacker: Player;
        defender: Player;
    };
};