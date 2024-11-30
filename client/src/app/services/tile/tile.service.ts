import { Injectable } from '@angular/core';
import { NO_OBJECT, TileId } from '@app/constants';
import { TileType } from '@common/constants';
import { GridOperationsInfo } from '@common/interfaces/grid-operations-info';
@Injectable({
    providedIn: 'root',
})
export class TileService {
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

    removeTile(event: MouseEvent, { position, tiles, objects }: GridOperationsInfo) {
        event.preventDefault();
        if (tiles[position.x][position.y] !== TileType.Ground && objects[position.x][position.y] === NO_OBJECT) {
            tiles[position.x][position.y] = TileType.Ground;
        }
        return tiles;
    }
}
