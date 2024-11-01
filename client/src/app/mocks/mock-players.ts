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
];
