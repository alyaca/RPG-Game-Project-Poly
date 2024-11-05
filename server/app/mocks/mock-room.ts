import { avatars } from '@common/avatars-info';
import { GameStatus, Room } from '@common/room';
import { mockGame } from './mock-game';

export const mockRooms: Room[] = [
    {
        gameMap: mockGame,
        roomId: '1234',
        listPlayers: [],
        availableAvatars: avatars,
        adminId: 'admin1234',
        isLocked: false,
        gameStatus: GameStatus.Lobby,
    },
    {
        gameMap: mockGame,
        roomId: '2345',
        listPlayers: [],
        availableAvatars: avatars,
        adminId: 'admin2345',
        isLocked: false,
        gameStatus: GameStatus.Lobby,
    },
];
