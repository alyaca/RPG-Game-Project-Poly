// Constants for the number of items and spawn points for each type of map
export const NB_ITEMS_SMALL_MAP = 2;
export const NB_ITEMS_MEDIUM_MAP = 4;
export const NB_ITEMS_LARGE_MAP = 6;

// Constants for the height/width of each type of map
export const SIZE_SMALL_MAP = 10;
export const SIZE_MEDIUM_MAP = 15;
export const SIZE_LARGE_MAP = 20;

export const OBJECT_COUNT_MAP: { [key: string]: number } = {
    small: NB_ITEMS_SMALL_MAP,
    medium: NB_ITEMS_MEDIUM_MAP,
    large: NB_ITEMS_LARGE_MAP,
};

//Constants for initial count of game objects
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
