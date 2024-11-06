import { Player, PlayerStats, Status } from '@common/player';

const mockPlayerStats: PlayerStats = {
    totalHp: 4,
    currentHp: 4,
    speed: 4,
    movementPointsLeft: 4,
    maxActionPoints: 1,
    actionPoints: 1,
    attack: 4,
    atkDiceMax: 4,
    defense: 4,
    defDiceMax: 4,
};

export const mockPlayers: Player[] = [
    {
        id: 'admin1234',
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
        id: 'id',
        attributes: mockPlayerStats,
        avatar: undefined,
        isActive: false,
        name: 'name',
        status: Status.Player,
        victories: 1,
        inventory: [],
        position: { x: 0, y: 0 },
    },
];
