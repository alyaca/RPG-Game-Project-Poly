import { mockPlayerStats } from '@app/mocks/mock-player-stats';
import { Player, Status } from '@common/player';

export const mockPlayers: Player[] = [
    {
        id: 'id',
        attributes: mockPlayerStats,
        avatar: undefined,
        isActive: true,
        name: 'name',
        status: Status.Player,
        victories: 1,
        inventory: [],
        position: { x: 0, y: 0 },
    },
    {
        id: '123',
        attributes: mockPlayerStats,
        avatar: undefined,
        isActive: true,
        name: 'name',
        status: Status.Admin,
        victories: 2,
        inventory: [],
        position: { x: 1, y: 1 },
    },
];
