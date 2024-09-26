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

    validateMap(array: number[][], title: string, description: string) {
        const errorMessages: string[] = [];

        if (!this.hasSufficientTerrainTiles(array)) {
            errorMessages.push("il n'y a pas assez de tuiles de terrain");
        }

        if (!this.validateAllDoors(array)) {
            errorMessages.push("au moins une porte n'est pas valide");
        }

        if (!this.isEveryTileAccessible(array)) {
            errorMessages.push('pas toutes les tuiles de terrain sont accessibles');
        }

        if (!this.validateTextInput(title, description)) {
            errorMessages.push('le titre ou la description de la carte est vide');
        }

        const message = errorMessages.length > 0
        ? '<ul><li>' + errorMessages.join('</li><li>') + '</li></ul>'
        : 'Sauvegarde réussie';

        const dialogTitle: string = errorMessages.length > 0 ? 'Carte invalide' : 'Carte valide'; 
        this.openDialog(message, dialogTitle);
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
        const directions = [
            { x: 0, y: 1 }, 
            { x: 1, y: 0 }, 
            { x: 0, y: -1 }, 
            { x: -1, y: 0 }, 
        ];
        const dfs = (row: number, col: number) => {
            visited[row][col] = true;
            for (const direction of directions) {
                const newRow = row + direction.x;
                const newCol = col + direction.y;
                if (
                    newRow >= 0 &&
                    newRow < array.length &&
                    newCol >= 0 &&
                    newCol < array[0].length &&
                    !visited[newRow][newCol] &&
                    array[newRow][newCol] !== TileType.Wall
                ) {
                    dfs(newRow, newCol);
                }
            }
        };
        let startFound = false;
        for (let row = 0; row < array.length; row++) {
            for (let col = 0; col < array[row].length; col++) {
                if (array[row][col] !== TileType.Wall) {
                    dfs(row, col);
                    startFound = true;
                    break;
                }
            }
            if (startFound) break;
        }
        for (let row = 0; row < array.length; row++) {
            for (let col = 0; col < array[row].length; col++) {
                if (array[row][col] !== TileType.Wall && !visited[row][col]) {
                    return false;
                }
            }
        }

        return true; 
    }

    openDialog(message: string, title: string) {
        this.dialog.open(EditionDialogComponent, {
            data: { message, title },
        });
    }

    validateTextInput(title: string, description: string): boolean {
        return title?.trim() !== '' && description?.trim() !== '';
    }
}
