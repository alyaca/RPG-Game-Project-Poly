import { GameTile } from './interfaces/game-tile'
import { TileType } from './constants'

export const gameTiles: GameTile[] = [
    {
        id: TileType.Ground,
        name: 'Gazon',
        image: './assets/images/tiles/grass.jpg',
        descriptions: [
            'Tuile par défaut du jeu (tuile de terrain)', 
            'Les joueurs et les objects peuvent y être posés dessus', 'coût: 1'
        ],
    },
    {
        id: TileType.Ice,
        name: 'Glace',
        image: './assets/images/tiles/ice.jpg',
        descriptions: [
            'Un joueur qui y marche dessus à 10% de chance de perdre pied et tomber, terminant instantanément le tour du joueur',
            'tant que le joueur se trouve sur de la glace, ses attributs « attaque » et « défense » souffrent d’un malus de 2.',
            'coût: 0',
        ],
    },
    {
        id: TileType.Water,
        name: 'Eau',
        image: './assets/images/tiles/water.jpg',
        descriptions: [
            'Tuile de terrain', 
            'Coût: 2'
        ],
    },
    {
        id: TileType.Wall,
        name: 'Mur',
        image: './assets/images/tiles/wall.jpg',
        descriptions: [
            'Obstacles infranchissables par les joueurs à moins que le joueur obtienne un item spécial',
            'Aucun objet y est placé dessus',
            'Pas considée comme une tuile de terrain',
        ],
    },
    {
        id: TileType.ClosedDoor,
        name: 'Porte fermée',
        image: './assets/images/tiles/closed-door.jpg',
        descriptions: [
            "Une porte fermée doit être ouverte par le joueur en interagissant avent le bouton 'Porte' s'il désire y passer à travers.",
            "Sinon il agit comme un obstacle infranchissable comme une tuile de mur à moins qu'on détienne un item spécial",
        ],
    },
    {
        id: TileType.OpenDoor,
        name: 'Porte ouverte',
        image: './assets/images/tiles/open-door.jpg',
        descriptions: [
            "Une porte fermée doit être ouverte par le joueur en interagissant avent le bouton 'Porte' s'il désire y passer à travers.",
            "Sinon il agit comme un obstacle infranchissable comme une tuile de mur à moins qu'on détienne un item spécial",
        ],
    },
]