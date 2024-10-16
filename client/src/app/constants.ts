// Constants for the number of items and spawn points for each type of map
export const NB_ITEMS_SMALL_MAP = 2;
export const NB_ITEMS_MEDIUM_MAP = 4;
export const NB_ITEMS_LARGE_MAP = 6;

// Constants for the height/width of each type of map
export const SIZE_SMALL_MAP = 10;
export const SIZE_MEDIUM_MAP = 15;
export const SIZE_LARGE_MAP = 20;

// Constants for edition page input min/max lengths
export const MIN_LEN_MAP_TITLE = 3;
export const MAX_LEN_MAP_TITLE = 30;
export const MIN_LEN_MAP_DESCRIPTION = 10;
export const MAX_LEN_MAP_DESCRIPTION = 128;

export const OBJECT_COUNT_MAP: { [key: string]: number } = {
    small: NB_ITEMS_SMALL_MAP,
    medium: NB_ITEMS_MEDIUM_MAP,
    large: NB_ITEMS_LARGE_MAP,
};

// Constants for initial count of game objects
export const ITEM_COUNT = 1;

export enum ObjectType {
    Trident = 1,
    Armor = 2,
    Sandal = 3,
    Lightning = 4,
    Xiphos = 5,
    Kunee = 6,
    Random = 7,
    Spawn = 8,
}

// For no object in grid
export const NO_OBJECT = 0;

// Constants for the size of the dialob box for the creation of a map
export const WIDTH_DIALOG = '40%';
export const HEIGHT_DIALOG = '50%';

// Constants for tests
export const NO_ITEM = 0;
export const RANDOM_ITEM = 1;

// Constants for the map validation to check all the necessary stuff
export const CHECK_BEFORE_SAVING_DELAY = 500;
export const VALIDATION_DURATION = 500;

export const TEST_VALIDATION_DURATION = 800;

// Constant for the time of the snakbar  message
export const MESSAGE_DURATION_ERROR = 4000;
export const MESSAGE_DURATION_CHARACTER_FORM = 2000;
export const MESSAGE_DURATION_SAVE_CHOICE = 3000;

// Constant for the padding length of the date
export const PAD_LENGTH = 2;

// Constants for attribut values
export const DEFAULT_ATTRIBUTE = '4';
export const HIGH_ATTRIBUTE = '6';
export const DICE_4 = '4 + (1-4)';
export const DICE_6 = '4 + (1-6)';

export const MAX_PLAYER_SIZE_INT = 2;
export const THREE_PLAYERS_LOBBY = 3;
export const FOUR_PLAYERS_LOBBY = 4;
export const FIVE_PLAYERS_LOBBY = 5;
