import { avatars } from '@common/avatars-info';
import { GameStatus, Room } from '@common/room';
import { mockGame } from './mock-game';
import { Player, Status } from '@common/player';

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
    {
        gameMap: mockGame,
        roomId: '1234',
        listPlayers: [
            {
                id: 'bot',
                name: 'Bot-Player',
                status: Status.Bot, // Assuming Status.Bot represents a bot player
                avatar: avatars[0], // Assigning an avatar to the bot player
            } as Player, // Cast to the Player type
        ],
        availableAvatars: avatars,
        adminId: 'admin1234',
        isLocked: false,
        gameStatus: GameStatus.Lobby,
    },
];
