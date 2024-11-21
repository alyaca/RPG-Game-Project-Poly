import { Player, Attributes, Status, PostGameStats } from '@common/player';
import { playerNavigation } from './mock-player';

export const mockAttributes: Attributes = {
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
    evasion: 2,
};

export const defaultPostGameStats: PostGameStats = {
    combats: 0,
    victories: 0,
    evasions: 0,
    defeats: 0,
    dmgDealt: 0,
    dmgTaken: 0,
    itemsObtained: 0,
    tilesVisited: 0
}

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
        spawnPosition: { x: 0, y: 0 },
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
        spawnPosition: { x: 0, y: 0 },
    },
];

export const mockNavigationPlayers: Player[] = [
    playerNavigation,
    {
        id: '456',
        attributes: {
            totalHp: 100,
            currentHp: 100,
            speed: 4,
            movementPointsLeft: 3,
            maxActionPoints: 1,
            actionPoints: 1,
            attack: 1,
            atkDiceMax: 1,
            defense: 1,
            defDiceMax: 1,
            evasion: 2,
        },
        avatar: { id: 21, name: 'a', src: 'a.img', isSelected: true, isTaken: true },
        isActive: true,
        name: 'Zeus',
        status: Status.Player,
        victories: 0,
        inventory: [],
        position: { x: 3, y: 0 },
        spawnPosition: { x: 0, y: 0 },
    },
];
