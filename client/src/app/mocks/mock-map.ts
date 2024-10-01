import { NB_ITEMS_MEDIUM_MAP, NO_ITEM, RANDOM_ITEM, SIZE_MEDIUM_MAP } from '@app/constants';
import { Info } from '@app/interfaces/info';
import { Map } from '@app/interfaces/map';
import { TileType } from '@app/services/map-validator/map-validator.service';

export const dummyInfo: Info = {
    image: 'image file',
    name: 'a map',
    description: 'a map description',
    grid: [[TileType.Ground, TileType.Ground, TileType.Ground, TileType.Ground, TileType.Ground]],
    items: [[NO_ITEM, NO_ITEM, RANDOM_ITEM, NO_ITEM, NO_ITEM, NO_ITEM]],
    height: SIZE_MEDIUM_MAP,
};

export const dummyMap: Map = {
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
