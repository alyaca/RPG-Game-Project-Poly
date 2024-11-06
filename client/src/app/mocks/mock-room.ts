import { avatars } from '@common/avatars-info';
import { GameStatus, Room } from '@common/room';
import { mockGames } from './mock-game';
import { mockLobbyPlayers } from './mock-lobby-players';

export const mockRoom: Room = {
    gameMap: mockGames[0],
    roomId: '1234',
    listPlayers: [mockLobbyPlayers[0]],
    isLocked: false,
    adminId: '1234-admin',
    availableAvatars: avatars,
    gameStatus: GameStatus.Lobby,
};
