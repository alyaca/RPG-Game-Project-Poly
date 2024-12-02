import { Injectable } from '@angular/core';
import { gameObjects } from '@common/objects-info';

import { TILE_DESCRIPTIONS, TILE_NAMES } from '@app/constants';
import { TileService } from '@app/services/tile/tile.service';
import { GameTile } from '@common/interfaces/game-tile';
import { Player } from '@common/interfaces/player';
import { Room } from '@common/interfaces/room';
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

    tileDescriptions = TILE_DESCRIPTIONS;

    tileNames = TILE_NAMES;

    constructor(public tileService: TileService) {}

    getItem() {
        const foundItem = gameObjects.find((item) => item.id === this.itemId);
        if (foundItem) {
            return foundItem;
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
