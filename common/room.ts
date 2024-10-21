import { Game } from './game';
import { Avatar, Player } from './player';

export interface Room {
    gameMap: Game;
    roomId: string;
    listPlayers: Player[];
    availableAvatars: Avatar[];
    adminId: string;
    isLocked: boolean;
}
