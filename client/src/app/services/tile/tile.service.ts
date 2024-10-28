import { inject, Injectable } from '@angular/core';
import { TileId, TileType } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';

@Injectable({
    providedIn: 'root',
})
export class TileService {
    private gameCreationService = inject(GameCreationService);

    getTileImage(value: number): string {
        switch (value) {
            case TileType.Ground:
                return './assets/images/tiles/grass.jpg';
            case TileType.Ice:
                return './assets/images/tiles/ice.jpg';
            case TileType.Wall:
                return './assets/images/tiles/wall.jpg';
            case TileType.Water:
                return './assets/images/tiles/water.jpg';
            case TileType.ClosedDoor:
                return './assets/images/tiles/closed-door.jpg';
            case TileType.OpenDoor:
                return './assets/images/tiles/open-door.jpg';
            default:
                return '';
        }
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
}
