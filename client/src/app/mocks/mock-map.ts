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
