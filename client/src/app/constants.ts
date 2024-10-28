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

export enum TileType {
    Ground = 1,
    Ice = 2,
    Water = 3,
    Wall = 4,
    ClosedDoor = 5,
    OpenDoor = 6,
}

// To validate a door position on a map
export const DIRECTIONS = [
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: 0 },
];

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

// Constant for the time of the snackbar message
export const MESSAGE_DURATION_ERROR = 4000;
export const MESSAGE_DURATION_CHARACTER_FORM = 2000;
export const MESSAGE_DURATION_SAVE_CHOICE = 3000;
export const MESSAGE_DURATION_VALIDATION_ERROR = 2000;

// Constant for the padding length of the date
export const PAD_LENGTH = 2;

// Constants for attribut values
export const DEFAULT_ATTRIBUTE = 4;
export const HIGH_ATTRIBUTE = 6;
export const DICE_4 = '4 + (1-4)';
export const DICE_6 = '4 + (1-6)';
export const DEFAULT_ACTION_POINT = 1;

export enum ErrorMessages {
    MissingAttributes = 'Veuillez sélectionner les valeurs des attributs souhaités',
    MissingName = 'Veuillez entrer un nom de personnage',
    MissingAvatar = 'Veuillez sélectionner un avatar',
    NameWithSpace = 'Le nom ne peut pas contenir des espaces',
}

// Constants for timer component
export const TOTAL_TIME = 60;
export const WARNING_TIME = 3;
export const TIMER_RADIUS = 45;
export const MILLISECONDS_IN_SECOND = 1000;
export const TIMER_CENTER_POSITION = 50;

export const TEMP_DIALOG_DURATION = 1500;
export const EVADE_SUCCES_RATE = 0.4;
export const COMBAT_TURN_LENGTH = 5;
export const SHORT_COMBAT_TURN_LENGTH = 3;

export const ROLL_DURATION = 800;

export const INIT_DISPLAY_DELAY = 50;
export const EXIT_COMBAT_DELAY = 3000;
export const INACTIVE_DICE_DELAY = 200;
export const DISPLAY_TEXT_DELAY = 300;
export const ATTACK_DELAY = 1200;
export const TURN_DIALOG_DELAY = 1000;
export const START_TURN_TIMER_DELAY = 2000;

export const FAIL_EVASION_RANDOM_NUM = 0.5;
export const SUCCES_EVASION_RANDOM_NUM = 0.1;
export const TIMER_ARC_WIDTH = 5;

// Constants for random generation
export const MAX_GENERATION_VALUE = 1000000000;

// Constants for main page test
export const NUMBER_OF_TEAM_MEMBERS = 6;
