import { Injectable } from '@angular/core';
import { gameObjects } from '@common/objects-info';

import { NavigationService } from '@app/services/navigation/navigation.service';
import { TileService } from '@app/services/tile/tile.service';
import { GameTile } from '@common/game-tile';
import { Player } from '@common/player';
import { Room } from '@common/room';
@Injectable({
    providedIn: 'root',
})
export class GameTileInfoService {
    tileId: number = 0;
    itemId: number = 0;
    selectedPlayer?: Player;
    selectedRow: number = -1;
    selectedCol: number = -1;
    gameTile: GameTile = {
        id: 1,
        name: '',
        descriptions: [],
        image: '',
    };

    tileDescriptions = [
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
        this.gameTile.descriptions = this.tileDescriptions[this.tileId - 1];
        return this.gameTile;
    }

    transferRoomData(room: Room) {
        this.tileId = room.gameMap.tiles[this.selectedRow][this.selectedCol];
        this.itemId = room.gameMap.itemPlacement[this.selectedRow][this.selectedCol];
        this.selectedPlayer = this.getPlayer(room);
    }

    getPlayer(room: Room) {
        for (const player of room.listPlayers) {
            if (player.position.x === this.selectedRow && player.position.y === this.selectedCol) {
                return player;
            }
        }
        return undefined;
    }
}
