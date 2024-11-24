import { avatars } from '@common/avatars-info';
import { Player, Status } from '@common/player';
import { GameStatus, Room } from '@common/room';
import { mockGame } from './mock-game';
import { mockNavigation } from './mock-navigation';

export const mockRoom: Room = {
    gameMap: mockGame,
    roomId: '1234',
    listPlayers: [],
    availableAvatars: avatars,
    adminId: 'admin1234',
    isLocked: false,
    gameStatus: GameStatus.Lobby,
    navigation: mockNavigation,
};

export const mockRooms: Room[] = [
    {
        gameMap: mockGame,
        roomId: '1234',
        listPlayers: [],
        availableAvatars: avatars,
        adminId: 'admin1234',
        isLocked: false,
        gameStatus: GameStatus.Lobby,
        navigation: mockNavigation,
    },
    {
        gameMap: mockGame,
        roomId: '2345',
        listPlayers: [],
        availableAvatars: avatars,
        adminId: 'admin2345',
        isLocked: false,
        gameStatus: GameStatus.Lobby,
        navigation: mockNavigation,
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

export const mockRoomDebug: Room[] = [
    {
        gameMap: mockGame,
        roomId: '1234',
        listPlayers: [],
        availableAvatars: avatars,
        adminId: 'admin1234',
        isLocked: false,
        gameStatus: GameStatus.Lobby,
        navigation: mockNavigation,
        isDebug: true,
    },
    {
        gameMap: mockGame,
        roomId: '1234',
        listPlayers: [],
        availableAvatars: avatars,
        adminId: 'admin1234',
        isLocked: false,
        gameStatus: GameStatus.Lobby,
        isDebug: false,
    },
];
