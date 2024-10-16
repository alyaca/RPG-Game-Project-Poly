import { Game } from './game';
import { Player } from './player';

export interface Room {
    gameMap: Game;
    roomId: string;
    listPlayers: Player[];
    adminId: string;
    isLocked: boolean;
}
