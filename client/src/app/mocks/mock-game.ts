import { GameObject } from '@app/interfaces/gameObject';
import { Game } from '@common/game';

export const mockGameObject: GameObject = {
    id: 1,
    name: 'map name',
    image: 'image string',
    description: 'the description for this beautiful map',
    count: 1,
};

export const mockGames: Game[] = [
    {
        _id: '1',
        name: 'Map1',
        description: 'Description1',
        visible: true,
        mode: 'CTF',
        nbPlayers: 6,
        image: 'img1',
        tiles: [
            [0, 1],
            [0, 1],
        ],
        dimension: 20,
        itemPlacement: [
            [0, 1],
            [0, 1],
        ],
        isSelected: false,
        lastModification: new Date(),
    },
    {
        _id: '2',
        name: 'Map2',
        description: 'Description2',
        visible: true,
        mode: 'Normal',
        nbPlayers: 6,
        image: 'img1',
        tiles: [
            [0, 1],
            [0, 1],
        ],
        dimension: 15,
        itemPlacement: [
            [0, 1],
            [0, 1],
        ],
        isSelected: false,
        lastModification: new Date(),
    },
];
