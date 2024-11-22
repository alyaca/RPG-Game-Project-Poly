// Constants for waiting page access code generation
export const ACCESS_CODE_LENGTH = 4;
export const MAX_ACCESS_CODE_VALUE = 10000;

// Constants for map-mocks
export enum TileType {
    Ground = 1,
    Ice = 2,
    Water = 3,
    Wall = 4,
    ClosedDoor = 5,
    OpenDoor = 6,
}

export const MODES = ['ctf', 'classic'];
export const GENERATE_COUNT = 5;
export const BASE_36 = 36;
export const TILE_COUNT = 6;
export const DIMENSION = 20;
export const NB_PLAYERS = 6;
export const COLUMN_LENGTH = 2;
export const ROW_LENGTH = 2;

export const NO_ITEM = 0;
export const RANDOM_ITEM = 1;

export const SMALL_MAP_PLAYERS = 2;
export const MEDIUM_MAP_PLAYERS = 4;

export const SIZE_SMALL_MAP = 10;
export const SIZE_MEDIUM_MAP = 15;

export const DEFAULT_DATE = new Date();

export const SPAWN_POINT_ID = 8;

// constants for timer
export const WARNING_TIME = 3;
export const STARTING_TIME = 3;
export const TURN_TIME = 30;
export const FIGHT_TIME = 5;
export const NO_EVASION_TIME = 3;
export const MILLISECONDS_IN_SECOND = 1000;

export const MOVEMENT_TIME = 150;
export const FELLING_PROBABILITY = 0.1;

export const SINGLE_PLAYER = 1;

// constant for tests
export const FOWARD_TIME = 1000;

// constants for tile cost
export enum TileCost {
    Ground = 1,
    Water = 2,
    Ice = 0,
    OpenDoor = 1,
}

export const VICTORIES = 3;
export const EVASION_SUCCESS_RATE = 0.4;
export const END_COMBAT_DELAY = 2500;

export const DEFAULT_ATTRIBUTE = 4;
export const MAX_GENERATION_VALUE = 1000000000;
