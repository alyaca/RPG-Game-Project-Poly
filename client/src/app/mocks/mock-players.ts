import { defaultPostGameStats } from '@app/default-attributes';
import { Player, Attributes, Status } from '@common/player';

const mockAttributes: Attributes = {
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
        attributes: mockAttributes,
        avatar: undefined,
        isActive: true,
        name: 'name',
        status: Status.Player,
        postGameStats: defaultPostGameStats,
        inventory: [],
        position: { x: 0, y: 0 },
    },
    {
        id: '123',
        attributes: mockAttributes,
        avatar: undefined,
        isActive: true,
        name: 'name',
        status: Status.Admin,
        postGameStats: defaultPostGameStats,
        inventory: [],
        position: { x: 1, y: 1 },
    },
    {
        id: 'id',
        attributes: mockAttributes,
        avatar: undefined,
        isActive: false,
        name: 'name',
        status: Status.Player,
        postGameStats: defaultPostGameStats,
        inventory: [],
        position: { x: 0, y: 0 },
    },
];
