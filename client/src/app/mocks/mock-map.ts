import { NB_ITEMS_MEDIUM_MAP, NO_ITEM, RANDOM_ITEM, SIZE_MEDIUM_MAP, TileType } from '@app/constants';
import { Info } from '@app/interfaces/info';
import { Game } from '@common/game';

export const dummyInfo: Info = {
    image: 'image file',
    name: 'a map',
    description: 'a map description',
    grid: [[TileType.Ground, TileType.Ground, TileType.Ground, TileType.Ground, TileType.Ground]],
    items: [[NO_ITEM, NO_ITEM, RANDOM_ITEM, NO_ITEM, NO_ITEM, NO_ITEM]],
    height: SIZE_MEDIUM_MAP,
};

export const dummyMap: Game = {
    _id: 'map to replace in DB',
    name: 'map name',
    description: 'description',
    visible: true,
    mode: 'normal',
    image: 'image source',
    nbPlayers: NB_ITEMS_MEDIUM_MAP,
    tiles: [[TileType.Ground, TileType.Ground, TileType.Ground, TileType.Ground, TileType.Ground, TileType.Ground]],
    itemPlacement: [[NO_ITEM, NO_ITEM, RANDOM_ITEM, NO_ITEM, RANDOM_ITEM]],
    dimension: SIZE_MEDIUM_MAP,
    isSelected: false,
    lastModification: new Date(),
};

export const mockGameNavigation: Game = {
    _id: '1',
    name: 'Mock Game',
    description: 'This is a mock game for testing purposes.',
    visible: true,
    mode: 'single-player',
    nbPlayers: 1,
    image: 'mock-image.png',
    tiles: [
        [TileType.Ground, TileType.Water, TileType.Wall],
        [TileType.Ice, TileType.OpenDoor, TileType.Wall],
        [TileType.Ice, TileType.Ice, TileType.Ice],
    ],
    dimension: 3,
    itemPlacement: [
        [1, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ],
    isSelected: false,
    lastModification: new Date(),
};
