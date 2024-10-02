import { Map } from '@app/model/schema/map.schema';
import mongoose from 'mongoose';

enum TileType {
    Ground = 1,
    Ice = 2,
    Water = 3,
    Wall = 4,
    ClosedDoor = 5,
    OpenDoor = 6,
}

export const MODES = ['CTF', 'Normal'];
export const GENERATE_COUNT = 5;
export const BASE_36 = 36;
export const TILE_COUNT = 6;
export const DIMENSION = 20;
export const NB_PLAYERS = 6;
export const COLUMN_LENGTH = 2;
export const ROW_LENGTH = 2;

const getRandomString = (): string => (Math.random() + 1).toString(BASE_36).substring(2);

const getRandom2DArray = (rows: number, cols: number, maxValue: number): number[][] =>
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.floor(Math.random() * maxValue)));

export const getFakeMaps = (count: number = GENERATE_COUNT): Map[] => {
    const maps: Map[] = [];
    for (let i = 0; i < count; i++) {
        const array2D = getRandom2DArray(ROW_LENGTH, COLUMN_LENGTH, TILE_COUNT);
        const isVisible = i % 2 === 0;
        maps.push({
            _id: new mongoose.Types.ObjectId().toHexString(),
            name: getRandomString(),
            description: getRandomString(),
            visible: isVisible,
            mode: MODES[Math.floor(Math.random() * MODES.length)],
            nbPlayers: NB_PLAYERS,
            image: 'Kratos.img',
            tiles: array2D,
            dimension: DIMENSION,
            itemPlacement: array2D,
            isSelected: false,
            lastModification: new Date(),
        });
    }
    return maps;
};

const NO_ITEM = 0;
const RANDOM_ITEM = 1;

const SMALL_MAP_PLAYERS = 2;
const MEDIUM_MAP_PLAYERS = 4;

const SIZE_SMALL_MAP = 10;
const SIZE_MEDIUM_MAP = 15;

const DEFAULT_DATE = new Date();
export const NEW_MAP_NO_ID = {
    name: 'map name',
    description: 'description of the map',
    visible: true,
    mode: 'normal',
    nbPlayers: SMALL_MAP_PLAYERS,
    image: 'image string',
    tiles: [
        [
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
        ],
        [
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
            TileType.Ground,
        ],
    ],
    dimension: SIZE_SMALL_MAP,
    itemPlacement: [
        [NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM],
        [NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM],
    ],
    isSelected: false,
    lastModification: DEFAULT_DATE,
};

export const EXISTING_MAP = {
    _id: '66f7162b7ec70b6faefa36fd',
    name: 'old name',
    description: 'old description',
    visible: true,
    mode: 'normal',
    nbPlayers: MEDIUM_MAP_PLAYERS,
    image: 'old image string',
    tiles: [
        [
            TileType.Water,
            TileType.Ice,
            TileType.Ground,
            TileType.Ice,
            TileType.Wall,
            TileType.OpenDoor,
            TileType.Ground,
            TileType.Ground,
            TileType.Water,
            TileType.Ice,
            TileType.Water,
            TileType.Ice,
            TileType.Wall,
            TileType.OpenDoor,
        ],
        [
            TileType.Water,
            TileType.Ice,
            TileType.Ground,
            TileType.Ice,
            TileType.Wall,
            TileType.OpenDoor,
            TileType.Ground,
            TileType.Ground,
            TileType.Water,
            TileType.Ice,
            TileType.Ground,
            TileType.Water,
            TileType.Ice,
            TileType.Wall,
        ],
    ],
    dimension: SIZE_MEDIUM_MAP,
    itemPlacement: [
        [
            NO_ITEM,
            RANDOM_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            RANDOM_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
        ],
        [
            NO_ITEM,
            RANDOM_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            RANDOM_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
        ],
    ],
    isSelected: false,
    lastModification: DEFAULT_DATE,
};

export const MAP_TO_PUT = {
    _id: '66f7162b7ec70b6faefa36fd',
    name: 'new name for the map',
    description: 'a different description than the last one',
    visible: true,
    mode: 'normal',
    nbPlayers: MEDIUM_MAP_PLAYERS,
    image: 'a new image to represent the tiles',
    tiles: [
        [
            TileType.Water,
            TileType.Ice,
            TileType.Ground,
            TileType.Ice,
            TileType.Wall,
            TileType.OpenDoor,
            TileType.Ground,
            TileType.Ground,
            TileType.Water,
            TileType.Ice,
            TileType.Water,
            TileType.Ice,
            TileType.Wall,
            TileType.OpenDoor,
        ],
        [
            TileType.Water,
            TileType.Ice,
            TileType.Ground,
            TileType.Ice,
            TileType.Wall,
            TileType.OpenDoor,
            TileType.Ground,
            TileType.Ground,
            TileType.Water,
            TileType.Ice,
            TileType.Ground,
            TileType.Water,
            TileType.Ice,
            TileType.Wall,
        ],
    ],
    dimension: SIZE_MEDIUM_MAP,
    itemPlacement: [
        [
            NO_ITEM,
            RANDOM_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            RANDOM_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
        ],
        [
            NO_ITEM,
            RANDOM_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
            RANDOM_ITEM,
            NO_ITEM,
            NO_ITEM,
            NO_ITEM,
        ],
    ],
    isSelected: false,
    lastModification: DEFAULT_DATE,
};
