import { avatars } from '@common/avatars-info';
import { Attributes, Behavior, Player, PostGameStats, Status } from '@common/player';
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
    damageDealt: 0,
    damageTaken: 0,
    itemsObtained: 0,
    tilesVisited: 0,
};

export const mockPlayers: Player[] = [
    {
        id: 'admin1234',
        attributes: mockAttributes,
        avatar: avatars[0],
        isActive: true,
        name: 'mobile',
        status: Status.Player,
        postGameStats: defaultPostGameStats,
        inventory: [],
        position: { x: 0, y: 0 },
        behavior: Behavior.Sentient,
        spawnPosition: { x: 0, y: 0 },
        positionHistory: [],
    },
    {
        id: 'id',
        attributes: mockAttributes,
        avatar: undefined,
        isActive: false,
        name: 'joseph',
        status: Status.Player,
        postGameStats: defaultPostGameStats,
        inventory: [],
        position: { x: 0, y: 0 },
        spawnPosition: { x: 0, y: 0 },
        behavior: Behavior.Sentient,
        positionHistory: [],
    },
    {
        id: 'bot',
        attributes: mockAttributes,
        avatar: undefined,
        isActive: false,
        name: 'loly',
        status: Status.Bot,
        postGameStats: defaultPostGameStats,
        inventory: [],
        position: { x: 0, y: 0 },
        spawnPosition: { x: 0, y: 0 },
        behavior: Behavior.Aggressive,
        positionHistory: [],
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
        postGameStats: defaultPostGameStats,
        inventory: [],
        position: { x: 3, y: 0 },
        spawnPosition: { x: 0, y: 0 },
        behavior: Behavior.Sentient,
        positionHistory: [],
    },
];

export const baseBot: Player = {
    id: '0',
    avatar: avatars[0],
    status: Status.Bot,
    name: 'Joueur virtuel',
    postGameStats: defaultPostGameStats,
    isActive: false,
    attributes: mockAttributes,
    inventory: [],
    position: { x: 0, y: 0 },
    spawnPosition: { x: 0, y: 0 },
    behavior: Behavior.Sentient,
    positionHistory: [],
};

export const playerDisconnected: Player = {
    id: 'disconnected',
    attributes: mockAttributes,
    avatar: undefined,
    isActive: false,
    name: 'player-disconnected',
    status: Status.Disconnected,
    postGameStats: defaultPostGameStats,
    inventory: [],
    position: { x: 0, y: 0 },
    spawnPosition: { x: 0, y: 0 },
    behavior: Behavior.Sentient,
    positionHistory: [],
};
