import { GameMode } from '@app/constants';
import { GameObject } from '@app/interfaces/game-object';
import { Game } from '@common/game';

export const mockGameObject: GameObject = {
    id: 1,
    name: 'map name',
    image: 'image string',
    description: 'the description for this beautiful map',
    count: 1,
};

export const mockGameObjectZeroId: GameObject = {
    id: 0,
    name: 'map name',
    image: 'image',
    description: 'description of the map',
    count: 1,
};

export const mockGames: Game[] = [
    {
        _id: '1',
        name: 'Map1',
        description: 'Description1',
        visible: true,
        mode: GameMode.Ctf,
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
        mode: GameMode.Classic,
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
