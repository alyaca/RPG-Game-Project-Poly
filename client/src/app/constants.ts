// import { Status } from '@app/interfaces/playerObject';
// import { Player } from '@common/player';
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
export const DEFAULT_ATTRIBUTE = 4;
export const HIGH_ATTRIBUTE = 6;
export const DEFAULT_ATTRIBUTE = 4;
export const HIGH_ATTRIBUTE = 6;
export const DICE_4 = '4 + (1-4)';
export const DICE_6 = '4 + (1-6)';
export const DEFAULT_ACTION_POINT = 1;

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
// Array for the static players for the game page
// export const PLAYERS: Player[] = [
//     {
//         id: '0',
//         avatar: '/assets/images/characters/Hephaestus.webp',
//         status: Status.Admin,
//         name: 'Jar Jar Binks',
//         victories: 2,
//         isActive: true,
//         attributes: {
//             totalHp: 6,
//             currentHp: 4,
//             speed: 1,
//             maxActionPoints: 2,
//             actionPoints: 1,
//             movementPointsLeft: 3,
//             attack: 4,
//             atkDiceMax: 6,
//             defense: 4,
//             defDiceMax: 4,
//             inventory: [
//                 {
//                     id: ObjectType.Trident,
//                     name: 'Trident',
//                     description: 'Trident de Poséidon',
//                     count: 1,
//                     image: '/assets/images/objects/poseidon-trident.jpg/',
//                 },
//                 {
//                     id: ObjectType.Sandal,
//                     name: 'Sandales ailées',
//                     description: 'Sandales augmentant la stat de rapidité',
//                     count: 1,
//                     image: '/assets/images/objects/winged-sandals.jpg/',
//                 },
//             ],
//         },
//     },
//     {
//         id: '1',
//         avatar: '/assets/images/characters/Zeus.webp',
//         status: Status.Player,
//         name: 'Obi-Wan Kenobi',
//         victories: 1,
//         isActive: false,
//         attributes: {
//             totalHp: 6,
//             currentHp: 4,
//             speed: 2,
//             maxActionPoints: 2,
//             actionPoints: 1,
//             movementPointsLeft: 3,
//             attack: 4,
//             atkDiceMax: 6,
//             defense: 4,
//             defDiceMax: 4,
//             inventory: [
//                 {
//                     id: ObjectType.Trident,
//                     name: 'Trident',
//                     description: 'Trident de Poséidon',
//                     count: 1,
//                     image: '/assets/images/objects/poseidon-trident.jpg/',
//                 },
//                 {
//                     id: ObjectType.Sandal,
//                     name: 'Sandales ailées',
//                     description: 'Sandales augmentant la stat de rapidité',
//                     count: 1,
//                     image: '/assets/images/objects/winged-sandals.jpg/',
//                 },
//             ],
//         },
//     },
//     {
//         id: '2',
//         avatar: '/assets/images/characters/Athena.webp',
//         status: Status.Player,
//         name: 'General Grievous',
//         victories: 2,
//         isActive: false,
//         attributes: {
//             totalHp: 6,
//             currentHp: 4,
//             speed: 3,
//             maxActionPoints: 2,
//             actionPoints: 1,
//             movementPointsLeft: 3,
//             attack: 4,
//             atkDiceMax: 6,
//             defense: 4,
//             defDiceMax: 4,
//             inventory: [
//                 {
//                     id: ObjectType.Trident,
//                     name: 'Trident',
//                     description: 'Trident de Poséidon',
//                     count: 1,
//                     image: '/assets/images/objects/poseidon-trident.jpg/',
//                 },
//                 {
//                     id: ObjectType.Sandal,
//                     name: 'Sandales ailées',
//                     description: 'Sandales augmentant la stat de rapidité',
//                     count: 1,
//                     image: '/assets/images/objects/winged-sandals.jpg/',
//                 },
//             ],
//         },
//     },
//     {
//         id: '3',
//         avatar: '/assets/images/characters/Poseidon.webp',
//         status: Status.Player,
//         name: 'Luke Skywalker',
//         victories: 1,
//         isActive: false,
//         attributes: {
//             totalHp: 6,
//             currentHp: 4,
//             speed: 4,
//             maxActionPoints: 2,
//             actionPoints: 1,
//             movementPointsLeft: 3,
//             attack: 4,
//             atkDiceMax: 6,
//             defense: 4,
//             defDiceMax: 4,
//             inventory: [
//                 {
//                     id: ObjectType.Trident,
//                     name: 'Trident',
//                     description: 'Trident de Poséidon',
//                     count: 1,
//                     image: '/assets/images/objects/poseidon-trident.jpg/',
//                 },
//                 {
//                     id: ObjectType.Sandal,
//                     name: 'Sandales ailées',
//                     description: 'Sandales augmentant la stat de rapidité',
//                     count: 1,
//                     image: '/assets/images/objects/winged-sandals.jpg/',
//                 },
//             ],
//         },
//     },
//     {
//         id: '4',
//         avatar: '/assets/images/characters/Artemis.webp',
//         status: Status.Bot,
//         name: 'Leia Organa',
//         victories: 0,
//         isActive: false,
//         attributes: {
//             totalHp: 6,
//             currentHp: 4,
//             speed: 5,
//             maxActionPoints: 2,
//             actionPoints: 1,
//             movementPointsLeft: 3,
//             attack: 4,
//             atkDiceMax: 6,
//             defense: 4,
//             defDiceMax: 4,
//             inventory: [
//                 {
//                     id: ObjectType.Trident,
//                     name: 'Trident',
//                     description: 'Trident de Poséidon',
//                     count: 1,
//                     image: '/assets/images/objects/poseidon-trident.jpg/',
//                 },
//                 {
//                     id: ObjectType.Sandal,
//                     name: 'Sandales ailées',
//                     description: 'Sandales augmentant la stat de rapidité',
//                     count: 1,
//                     image: '/assets/images/objects/winged-sandals.jpg/',
//                 },
//             ],
//         },
//     },
//     {
//         id: '5',
//         avatar: '/assets/images/characters/Hestia.webp',
//         status: Status.Disconnected,
//         name: 'Chewbacca',
//         victories: 2,
//         isActive: false,
//         attributes: {
//             totalHp: 6,
//             currentHp: 4,
//             speed: 6,
//             maxActionPoints: 2,
//             actionPoints: 1,
//             movementPointsLeft: 3,
//             attack: 4,
//             atkDiceMax: 6,
//             defense: 4,
//             defDiceMax: 4,
//             inventory: [
//                 {
//                     id: ObjectType.Trident,
//                     name: 'Trident',
//                     description: 'Trident de Poséidon',
//                     count: 1,
//                     image: '/assets/images/objects/poseidon-trident.jpg/',
//                 },
//                 {
//                     id: ObjectType.Sandal,
//                     name: 'Sandales ailées',
//                     description: 'Sandales augmentant la stat de rapidité',
//                     count: 1,
//                     image: '/assets/images/objects/winged-sandals.jpg/',
//                 },
//             ],
//         },
//     },
// ];
