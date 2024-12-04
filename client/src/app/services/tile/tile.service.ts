import { inject, Injectable } from '@angular/core';
import { NO_OBJECT, TileId } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { TileType } from '@common/constants';
import { TileRemoval } from '@common/interfaces/tile-removal';
import { gameTiles } from '@common/tile-info';
@Injectable({
    providedIn: 'root',
})
export class TileService {
    private gameCreationService = inject(GameCreationService);

    getTileImage(value: number): string {
        const gameTile = gameTiles.find((tile) => tile.id === value);
        if (gameTile) {
            return gameTile.image;
        }
        return '';
    }

    setTile(selectedTile: string, row: number, col: number, array: number[][]) {
        switch (selectedTile) {
            case TileId.Ice:
                array[row][col] = TileType.Ice;
                break;
            case TileId.Wall:
                array[row][col] = TileType.Wall;
                break;
            case TileId.Water:
                array[row][col] = TileType.Water;
                break;
            case TileId.Door:
                array[row][col] = array[row][col] === TileType.ClosedDoor ? TileType.OpenDoor : TileType.ClosedDoor;
                break;
            default:
                break;
        }
    }

    resetGrid(mapSize: number, array: number[][]): number[][] {
        if (!this.gameCreationService.isNewGame) {
            return this.gameCreationService.loadedTiles;
        }
        array = Array.from({ length: mapSize }, () => Array(mapSize).fill(TileType.Ground));
        return array;
    }

    removeTile(event: MouseEvent, { position, tiles, objects }: TileRemoval) {
        event.preventDefault();
        if (tiles[position.x][position.y] !== TileType.Ground && objects[position.x][position.y] === NO_OBJECT) {
            tiles[position.x][position.y] = TileType.Ground;
        }
        return tiles;
    }
}
