import { Navigation } from '../server/app/classes/navigation/navigation';
import { Game } from './game';
import { Avatar, Player } from './player';

export enum GameStatus {
    Lobby = 'lobby',
    Started = 'started',
}
export interface Room {
    gameMap: Game;
    roomId: string;
    listPlayers: Player[];
    availableAvatars: Avatar[];
    adminId: string;
    isLocked: boolean;
    gameStatus: GameStatus;
    navigation?: Navigation;
    isDebug?: boolean;
}
