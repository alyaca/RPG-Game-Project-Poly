import { Navigation } from '@app/classes/navigation/navigation';
import { mockGame } from './mock-game';
import { mockPlayers } from './mock-players';

export const mockNavigation = {
    hasHandleDoorAction: jest.fn(),
    findReachableTiles: jest.fn(),
    initializeNavigation: jest.fn(),
    haveActions: jest.fn(),
    players: mockPlayers,
    gameMap: mockGame,
} as unknown as jest.Mocked<Navigation>;
