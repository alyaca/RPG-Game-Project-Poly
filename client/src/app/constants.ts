import { GlobalPostGameStat, GlobalStatType } from '@common/interfaces/global-post-game-stats';
import { PlayerStatType, PostGameStat } from '@common/interfaces/post-game-stat';

export const MAX_INVENTORY_ITEMS = 2;

// Constants for the number of items and spawn points for each type of map
export const MIN_NB_ITEMS = 2;
export const NB_ITEMS_SMALL_MAP = 2;
export const NB_ITEMS_MEDIUM_MAP = 4;
export const NB_ITEMS_LARGE_MAP = 6;

// Constants for the height/width of each type of map
export const SIZE_SMALL_MAP = 10;
export const SIZE_MEDIUM_MAP = 15;
export const SIZE_LARGE_MAP = 20;
export const TEST_INVALID_SIZE = 12;

// Constants for edition page input min/max lengths
export const MIN_LEN_MAP_TITLE = 3;
export const MAX_LEN_MAP_TITLE = 30;
export const MIN_LEN_MAP_DESCRIPTION = 10;
export const MAX_LEN_MAP_DESCRIPTION = 128;

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

export const TEST_VALIDATION_DURATION = 1200;

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
export const DEFAULT_EVASION_POINT = 2;

// Constants for the maximum size of a file
export const BYTES_PER_KILOBYTE = 1024;
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * BYTES_PER_KILOBYTE * BYTES_PER_KILOBYTE;

export enum ErrorMessages {
    MissingAttributes = 'Veuillez sélectionner les valeurs des attributs souhaités',
    MissingName = 'Veuillez entrer un nom de personnage',
    MissingAvatar = 'Veuillez sélectionner un avatar',
    NameWithSpace = 'Le nom ne peut pas contenir des espaces',
    TitleInvalidLength = '- Le titre de la carte doit avoir une longueur entre 3 et 30 caractères et ne pas uniquement contenir des espaces',
    NameAlreadyExists = '- Une carte avec le même nom existe déjà',
    InvalidFile = '- Le fichier est invalide',
    InvalidTilesDimensions = '- Les dimensions des tuiles sont invalides',
    InvalidDimension = '- Les dimensions de la carte sont invalides',
    InvalidTileType = '- Un ou plusieurs types de tuiles sont invalides',
    InvalidObjectType = "- Un ou plusieurs types d'objets sont invalides",
    FileTooLarge = '- Le fichier est trop volumineux',
    InvalidMode = '- Le mode de jeu est invalide',
    InvalidNbPlayers = '- Le nombre de joueurs est invalide pour la taille de la carte sélectionnée',
    InvalidNbObjects = "- Le nombre d'objets est invalide pour la taille de la carte sélectionnée",
}

// Constants for timer component
export const TOTAL_TIME = 60;
export const WARNING_TIME = 3;
export const TIMER_RADIUS = 45;
export const MILLISECONDS_IN_SECOND = 1000;
export const TIMER_CENTER_POSITION = 50;
export const ATTACK_TIME = 5;

export const TEMP_DIALOG_DURATION = 1500;
export const LONG_TEMP_DIALOG_DURATION = 4500;
export const EVADE_SUCCES_RATE = 0.4;
export const COMBAT_TURN_LENGTH = 5;
export const SHORT_COMBAT_TURN_LENGTH = 3;

export const ROLL_DURATION = 800;

export const INIT_DISPLAY_DELAY = 50;
export const EXIT_COMBAT_DELAY = 4000;
export const INACTIVE_DICE_DELAY = 200;
export const DISPLAY_TEXT_DELAY = 300;
export const ATTACK_DELAY = 1200;
export const TURN_DIALOG_DELAY = 1000;
export const START_TURN_TIMER_DELAY = 2000;
export const DISPLAY_DICE_DELAY = 1300;
export const ROLL_DICE_DELAY = 4000;

export const FAIL_EVASION_RANDOM_NUM = 0.5;
export const SUCCES_EVASION_RANDOM_NUM = 0.1;
export const TIMER_ARC_WIDTH = 5;

// Constants for random generation
export const MAX_GENERATION_VALUE = 1000000000;

// Constants for timer
export const STARTING_TIME = 3;
export const TURN_TIME = 30;

// Constants for main page test
export const NUMBER_OF_TEAM_MEMBERS = 6;

// Constants for tiles button in map editor
export enum TileId {
    Water = 'water-tile',
    Ice = 'ice-tile',
    Wall = 'wall-tile',
    Door = 'door-tile',
}
export enum TileButtonName {
    Water = 'Eau',
    Ice = 'Glace',
    Door = 'Porte',
    Wall = 'Mur',
}

export enum TileClass {
    Water = 'water',
    Ice = 'ice',
    Door = 'door',
    Wall = 'wall',
}

export const NAVIGATION_DELAY = 150;

// Maximum number of players in a room
export const MAX_PLAYER_SMALL_MAP = 2;
export const MAX_PLAYER_MEDIUM_MAP = 4;
export const MAX_PLAYER_LARGE_MAP = 6;

// Constants for the maximum number of players for each type of map
export const MAX_NUMBER_PLAYER: { [key: string]: number } = {
    small: MAX_PLAYER_SMALL_MAP,
    medium: MAX_PLAYER_MEDIUM_MAP,
    large: MAX_PLAYER_LARGE_MAP,
};

// Constant for the minimum number of players for each type of map
export const MIN_NUMBER_PLAYER = 2;

// Constant for only player
export const SINGLE_PLAYER = 1;

// Constants for dialog
export enum DialogOptions {
    Close = 'Fermer',
    Confirm = 'Confirmer',
    Cancel = 'Annuler',
    Quit = 'Quitter',
    Stay = 'Rester',
}
export enum DialogTitle {
    StartGame = 'Débuter la partie',
    GameCanceled = 'Partie annulée',
    QuitGame = 'Abandonner la partie',
    KickedOut = 'Vous avez été exclu de la partie',
    DrawGame = 'Partie nulle',
    EndTurn = 'Fin de votre tour',
    EndGame = 'Fin de la partie',
    EndFight = 'Fin du combat',
    DefaultFightWin = 'Abandon de partie',
    SuccessEvasion = 'Évasion réussie',
    MaxPlayers = 'Nombre de joueurs maximal atteint',
    AddBotWhenLocked = 'Partie vérrouillée',
    ItemExchange = 'Échanger un objet',
    QuitPostGameLobby = "Retourner à la page d'accueil",
}

export enum DialogMessages {
    NotEnoughPlayers = `Il faut au moins ${MIN_NUMBER_PLAYER} joueurs pour commencer la partie`,
    ConfirmStartGame = 'Êtes-vous certains de vouloir débuter la partie?',
    RoomLocked = 'Il faut verrouiller la salle afin de commencer la partie',
    QuitGame = 'Voulez-vous quitter la partie ?',
    KickedOut = "L'administrateur a décidé de vous retirer de la partie. Vous allez être redirigé vers l'accueil.",
    DrawGame = "Tous les joueurs ont abandonné. Vous aller être redirigé vers l'accueil.",
    Fell = 'Vous avez glissé sur la glace. Votre tour est terminé.',
    EndFight = 'Le combat est terminé. Le gagnant du combat est ',
    DefaultFightWin = "L'adversaire a abandonné la partie. Vous gagnez par défaut le combat.",
    MaxPlayers = "Vous ne pouvez plus d'ajouter de joueurs virtuels",
    AddBotWhenLocked = "Déverrouillez la salle d'attente avant d'ajouter un joueur virtuel",
    QuitPostGameLobby = 'Vous quitteriez la page de fin de partie',
}
export enum DialogResult {
    Right = 'right',
    Left = 'left',
    Close = 'close',
}

export const INVALID_TILES_TYPE = 999;

export const INFO_DIALOG_TIME = 2500;

export const SECS_IN_HOUR = 3600;
export const SECS_IN_MIN = 60;
export const MINS_IN_HOUR = 60;

export const TOTAL_PERCENTAGE = 100;

export const VICTORIES_FOR_WIN = 3;

export const PLAYER_STAT_TYPES: PostGameStat[] = [
    {
        id: 0,
        key: PlayerStatType.Combats,
        displayText: 'Combats',
        explanations: 'Nombre de combats participés par le joueur',
    },
    {
        id: 1,
        key: PlayerStatType.Victories,
        displayText: 'W/D/L',
        explanations: 'Résultats des combats du joueur sous la forme victoires/évasions/défaites',
    },
    {
        id: 2,
        key: PlayerStatType.DamageDealt,
        displayText: 'Dég. infligés',
        explanations: 'Nombre de points de dégats infligés sur les joueurs adverses',
    },
    {
        id: 3,
        key: PlayerStatType.DamageTaken,
        displayText: 'Dégats subis',
        explanations: 'Nombre de points de dégats subis par le joueur',
    },
    {
        id: 4,
        key: PlayerStatType.ItemsObtained,
        displayText: 'Obj. récup.',
        explanations: "Nombre d'objets distincts ramassés par le joueur au cours de la partie",
    },
    {
        id: 5,
        key: PlayerStatType.TilesVisited,
        displayText: '%tuiles visités',
        explanations: 'Pourcentage des tuiles de terrain visités par le joueur',
    },
];

export const GLOBAL_STAT_TYPES: GlobalPostGameStat[] = [
    {
        id: 0,
        key: GlobalStatType.GameDuration,
        displayText: 'Durée de la partie',
        explanations: "Temps écoulé depuis le début de la partie jusqu'à la fin de la partie",
    },
    {
        id: 1,
        key: GlobalStatType.Turns,
        displayText: 'Nombre de tours',
        explanations: 'Somme des tours de tous les joueurs de cette partie',
    },
    {
        id: 2,
        key: GlobalStatType.GlobalTilesVisited,
        displayText: '% tuiles visitées global',
        explanations: 'Pourcentage des tuiles de terrain visitées par au moins un joueur',
    },
    {
        id: 3,
        key: GlobalStatType.DoorsInteracted,
        displayText: '% portes interagies',
        explanations: 'Pourcentage des portes ayant été manipulées au moins une fois',
    },
    {
        id: 4,
        key: GlobalStatType.NbFlagBearers,
        displayText: 'détenteurs de drapeau',
        explanations: 'Nombre de joueurs différents ayant détenu le drapeau (si applicable)',
    },
];

export enum SortOrder {
    Unsorted = 'unsorted',
    Ascending = 'ascending',
    Descending = 'descending',
}

export const TILE_DESCRIPTIONS = [
    ['Tuile par défaut du jeu (tuile de terrain)', 'Les joueurs et les objects peuvent y être posés dessus', 'coût: 1'],
    [
        'Un joueur qui y marche dessus à 10% de chance de perdre pied et tomber, terminant instantanément le tour du joueur',
        'tant que le joueur se trouve sur de la glace, ses attributs « attaque » et « défense » souffrent d’un malus de 2.',
        'coût: 0',
    ],
    ['Tuile de terrain', 'Coût: 2'],
    [
        'Obstacles infranchissables par les joueurs à moins que le joueur obtienne un item spécial',
        'Aucun objet y est placé dessus',
        'Pas considée comme une tuile de terrain',
    ],

    [
        "Une porte fermée doit être ouverte par le joueur en interagissant avent le bouton 'Porte' s'il désire y passer à travers.",
        'Sinon il agit comme un obstacle infranchissable comme une tuile de mur.',
    ],
    ['Une porte ouverte agit comme une tuile de gazon', "Elle peut être fermée par le joueur en interagissant avec le bouton 'Porte'."],
];
