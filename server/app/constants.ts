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

export const GENERATE_COUNT = 5;
export const BASE_36 = 36;
export const TILE_COUNT = 6;
export const DIMENSION = 20;
export const NB_PLAYERS = 6;
export const COLUMN_LENGTH = 2;
export const ROW_LENGTH = 2;

export const NO_ITEM = 0;
export const RANDOM_ITEM = 1;
export const DEFAULT_ACTION_POINT = 1;
export const MAX_ACTION_POINT = 2;

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
export const TWO_BOTS_FIGHT_TIME = 1;
export const NO_EVASION_TIME = 3;
export const NO_ATTACK_TIME = 25;
export const MILLISECONDS_IN_SECOND = 1000;

export const MOVEMENT_TIME = 150;
export const FALLING_PROBABILITY = 0.1;

export const BOT_NAVIGATION_RANDOM = 0.5;

export const SINGLE_PLAYER = 1;
export const ROLL_DURATION = 800;

// constants for tests
export const FORWARD_TIME = 1000;
export const RANDOM_INT = 5;
export const MAX_RANGE = 3000;
export const SIZE_LARGE_MAP = 20;

export const VICTORIES = 3;
export const EVASION_SUCCESS_RATE = 0.4;
export const END_COMBAT_DELAY = 2500;
export const PLAYER_FELL_DELAY = 2500;

export const DEFAULT_ATTRIBUTE = 4;
export const HIGH_ATTRIBUTE = 6;
export const EQUAL_ODDS_SUCCESS = 0.6;
export const EQUAL_ODDS_PROBABILITY = 0.5;
export const EQUAL_ODDS_FAIL = 0.4;

export const MIN_DICE_VALUE = 1;

export const SECS_IN_HOUR = 3600;
export const SECS_IN_MIN = 60;
export const MINS_IN_HOUR = 60;
export const MAX_GENERATION_VALUE = 1000000000;
export const DISCONNECTED_POSITION = { x: 100, y: 100 };

export const enum LogType {
    StartTurn = 'TURN',
    GiveUp = 'GIVE_UP',
    OpenDoor = 'OPEN_DOOR',
    CloseDoor = 'CLOSE_DOOR',
    StartCombat = 'START_COMBAT',
    WinCombat = 'WIN_COMBAT',
    EvadeCombatFail = 'EVADE_COMBAT_FAIL',
    EvadeCombatSuccess = 'EVADE_COMBAT_SUCCESS',
    NoWinnerCombat = 'NO_WINNER_COMBAT',
    AttackFail = 'ATTACK_FAIL',
    AttackSuccess = 'ATTACK_SUCCESS',
}

export const ICE_TILE_PENALTY_VALUE = 2;
export const XIPHOS_ATTACK_BONUS = 2;
export const XIPHOS_DEFENSE_PENALTY = 1;
export const MAX_OBJECT_EFFECT = 2;
export const MIN_OBJECT_EFFECT = 1;
export const ADD_OBEJCT_EFFECT_FACTOR = 1;
export const REMOVE_OBEJECT_EFFECT_FACTOR = -1;
export const INVENTORY_SIZE = 2;

export const DEFAULT_COMBAT_RESULT = { attackValues: { diceValue: 0, total: 0 }, defenseValues: { diceValue: 0, total: 0 } };

export const MODES = ['CaptureDeDrapeau', 'classique'];
