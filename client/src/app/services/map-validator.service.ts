import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EditionDialogComponent } from '@app/components/edition-dialog/edition-dialog.component'; 

export enum TileType {
    Ground = 1,
    Ice = 2,
    Water = 3,
    Wall = 4,
    ClosedDoor = 5,
    OpenDoor = 6,
}

@Injectable({
    providedIn: 'root',
})
export class MapValidatorService {
    constructor(private dialog: MatDialog) {}

    validateMap(array: number[][]) {
        const errorMessages: string[] = [];

        if (!this.hasSufficientTerrainTiles(array)) {
            errorMessages.push('il n\'y a pas assez de tuiles de terrain');
        }

        if (!this.validateAllDoors(array)) {
            errorMessages.push('au moins une porte n\'est pas valide');
        }

        if (!this.isEveryTileAccessible(array)) {
            errorMessages.push('as toutes les tuiles de terrain sont accessibles');
        }

        // Use MatDialog instead of alert
        const message = errorMessages.length > 0 ? errorMessages.join(' et ') : 'Votre carte est valide';
        this.openDialog(message);
    }

    isDoorPlacementValid(array: number[][], row: number, col: number): boolean {
        const isWallAbove = array[row - 1]?.[col] === TileType.Wall;
        const isWallBelow = array[row + 1]?.[col] === TileType.Wall;
        const isWallLeft = array[row]?.[col - 1] === TileType.Wall;
        const isWallRight = array[row]?.[col + 1] === TileType.Wall;

        const isTerrainAbove = array[row - 1]?.[col] < TileType.Wall;
        const isTerrainBelow = array[row + 1]?.[col] < TileType.Wall;
        const isTerrainLeft = array[row]?.[col - 1] < TileType.Wall;
        const isTerrainRight = array[row]?.[col + 1] < TileType.Wall;

        return (isWallBelow && isWallAbove && isTerrainLeft && isTerrainRight) || (isWallLeft && isWallRight && isTerrainAbove && isTerrainBelow);
    }

    validateAllDoors(array: number[][]): boolean {
        for (let row = 0; row < array.length; row++) {
            for (let col = 0; col < array[row].length; col++) {
                if (array[row][col] > TileType.Wall && !this.isDoorPlacementValid(array, row, col)) {
                    return false;
                }
            }
        }
        return true;
    }

    hasSufficientTerrainTiles(array: number[][]): boolean {
        let nTerrainTiles = 0;
        for (const row of array) {
            for (const tile of row) {
                if (tile < TileType.Wall) {
                    nTerrainTiles++;
                }
            }
        }
        return nTerrainTiles > array.length ** 2 / 2;
    }

    isEveryTileAccessible(array: number[][]): boolean {
        const visited = Array.from({ length: array.length }, () => Array(array[0].length).fill(false));

        // Directions for moving up, down, left, right
        const directions = [
            { x: 0, y: 1 }, // Right
            { x: 1, y: 0 }, // Down
            { x: 0, y: -1 }, // Left
            { x: -1, y: 0 }, // Up
        ];

        const dfs = (row: number, col: number) => {
            // Mark the current tile as visited
            visited[row][col] = true;

            // Explore all four directions
            for (const direction of directions) {
                const newRow = row + direction.x;
                const newCol = col + direction.y;

                // Check bounds and whether the tile is non-wall and not visited
                if (
                    newRow >= 0 &&
                    newRow < array.length &&
                    newCol >= 0 &&
                    newCol < array[0].length &&
                    !visited[newRow][newCol] &&
                    array[newRow][newCol] !== TileType.Wall // Non-wall tile
                ) {
                    dfs(newRow, newCol);
                }
            }
        };

        // Find the first non-wall tile to start the DFS
        let startFound = false;
        for (let row = 0; row < array.length; row++) {
            for (let col = 0; col < array[row].length; col++) {
                if (array[row][col] !== TileType.Wall) {
                    // Non-wall tile
                    // Start DFS from the first found non-wall tile
                    dfs(row, col);
                    startFound = true;
                    break;
                }
            }
            if (startFound) break;
        }

        // Check if all non-wall tiles were visited
        for (let row = 0; row < array.length; row++) {
            for (let col = 0; col < array[row].length; col++) {
                if (array[row][col] !== TileType.Wall && !visited[row][col]) {
                    return false; // Found an accessible non-wall tile that wasn't visited
                }
            }
        }

        return true; // All non-wall tiles are accessible
    }

    openDialog(message: string) {
        this.dialog.open(EditionDialogComponent, {
            data: { message }
        });
    }
}
