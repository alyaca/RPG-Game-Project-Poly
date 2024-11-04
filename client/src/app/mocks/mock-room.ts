import { avatars } from '@common/avatars-info';
import { GameStatus, Room } from '@common/room';
import { mockGames } from './mock-game';

export const mockRoom: Room = {
    gameMap: mockGames[0],
    roomId: '1234',
    listPlayers: [],
    isLocked: false,
    adminId: '1234-admin',
    availableAvatars: avatars,
    gameStatus: GameStatus.Lobby,
};
