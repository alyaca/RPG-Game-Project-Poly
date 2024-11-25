import { SPAWN_POINT_ID } from '@app/constants';
import { Game } from '@common/game';

export const mockGame: Game = {
    _id: '1',
    name: 'Map1',
    description: 'Description1',
    visible: true,
    mode: 'ctf',
    nbPlayers: 6,
    image: 'img1',
    tiles: [
        [0, 1],
        [0, 1],
        [0, 0],
    ],
    dimension: 20,
    itemPlacement: [
        [0, SPAWN_POINT_ID],
        [0, SPAWN_POINT_ID],
        [0, 0],
    ],
    isSelected: false,
    lastModification: new Date(),
};

export const mockGameDebug: Game = {
    _id: '1',
    name: 'Map1',
    description: 'Description1',
    visible: true,
    mode: 'normal',
    nbPlayers: 2,
    image: 'img1',
    tiles: [
        [0, 0],
        [1, 1],
    ],
    dimension: 2,
    itemPlacement: [
        [0, SPAWN_POINT_ID],
        [0, SPAWN_POINT_ID],
    ],
    isSelected: false,
    lastModification: new Date(),
};
