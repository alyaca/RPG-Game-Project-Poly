import { Injectable } from '@angular/core';
import { gameObjects } from '@app/objects-info';

import { NavigationService } from '@app/services/navigation/navigation.service';
import { TileService } from '@app/services/tile/tile.service';
import { GameTile } from '@common/game-tile';
@Injectable({
    providedIn: 'root',
})
export class GameTileInfoService {
    tileId: number = 0;
    itemId: number = 0;
    selectedRow: number = -1;
    selectedCol: number = -1;
    gameTile: GameTile = {
        id: 1,
        name: '',
        description: '',
        image: '',
    };

    tileDescriptions = [
        `Le gazon est la tuile par défaut du jeu. C'est une tuile de terrain ayant un cout de 1. 
    Les joueurs et les objects peuvent y être posés dessus`,

        `La glace à un coût de 0, cependant un joueur qui y marche dessus à 10% de chance de perdre pied et
    tomber, terminant instantanément le tour du joueur. De plus, tant que le joueur se trouve sur
    de la glace, ses attributs « attaque » et « défense » souffrent d’un malus de 2.`,

        "L'eau est une tuile de terrain ayant un coût de 2.",

        'Les murs sont des obstacles infranchissables par les joueurs. Aussi, aucun objet y est placé dessus',

        `Une porte fermée doit être ouverte par le joueur en interagissant avent le bouton 'Porte' s'il désire
    y passer à travers. Sinon il agit comme un obstacle infranchissable comme une tuile de mur.`,

        `Une porte ouverte agit comme une tuile de gazon, ayant aussi un coût de 1. Elle peut être fermée par 
    le joueur en interagissant avec le bouton 'Porte'.`,
    ];

    tileNames = ['Gazon', 'Glace', 'Eau', 'Mur', 'Porte fermée', 'Porte ouverte'];

    constructor(
        public tileService: TileService,
        public navigationService: NavigationService,
    ) {}

    getItem() {
        if (this.itemId > 0) {
            return gameObjects[this.itemId - 1];
        }
        return null;
    }

    getTile() {
        this.gameTile.id = this.tileId;
        this.gameTile.name = this.tileNames[this.tileId - 1];
        this.gameTile.image = this.tileService.getTileImage(this.tileId);
        this.gameTile.description = this.tileDescriptions[this.tileId - 1];
        return this.gameTile;
    }

    getPlayer() {
        for (const player of this.navigationService.players) {
            if (player.position.x === this.selectedRow && player.position.y === this.selectedCol) {
                return player;
            }
        }
        return null;
    }
}
