import { Game } from './game';
import { Avatar, Player } from './player';

export enum GameStatus {
    Lobby = 'lobby',
    Started = 'started',
    Paused = 'paused',
}
export interface Room {
    gameMap: Game;
    roomId: string;
    listPlayers: Player[];
    availableAvatars: Avatar[];
    adminId: string;
    isLocked: boolean;
    gameStatus: GameStatus;
}
