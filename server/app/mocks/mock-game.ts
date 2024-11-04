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
    ],
    dimension: 20,
    itemPlacement: [
        [0, 8],
        [0, 8],
    ],
    isSelected: false,
    lastModification: new Date(),
};
