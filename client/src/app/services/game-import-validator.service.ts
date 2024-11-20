import { Injectable } from '@angular/core';
import {
    DIRECTIONS,
    ErrorMessages,
    MAX_LEN_MAP_DESCRIPTION,
    MAX_LEN_MAP_TITLE,
    MIN_LEN_MAP_DESCRIPTION,
    MIN_LEN_MAP_TITLE,
    ObjectType,
    TileType,
} from '@app/constants';
import { Game } from '@common/game';
import { GameListService } from './game-list/game-list.service';

@Injectable({
    providedIn: 'root',
})
export class GameImportValidatorService {
    errorMessages: string[] = [];
    validMap: boolean;

    constructor(private gameListService: GameListService) {}

    async validateMap(game: Game): Promise<string[]> {
        return new Promise((resolve) => {
            this.errorMessages = [];

            this.validateName(game.name).then(() => {
                this.validateSufficientTerrainTiles(game.tiles);
                this.validateAllDoors(game.tiles);
                this.validateAllSpawnPointsPlaced(game);
                this.validateTileAccessibility(game.tiles);
                this.validateTitle(game.name);
                this.validateDescription(game.description);

                resolve(this.errorMessages);
            });
        });
    }

    private async validateName(nameToCheck: string): Promise<void> {
        const trimmedNameToCheck = nameToCheck.trim();
        return new Promise((resolve) => {
            this.gameListService.getAllGames().subscribe((allMaps) => {
                allMaps.forEach((map) => {
                    if (map.name.trim() === trimmedNameToCheck) {
                        this.errorMessages.push(ErrorMessages.NameAlreadyExists);
                    }
                });
                resolve();
            });
        });
    }

    private validateSufficientTerrainTiles(array: number[][]) {
        let nTerrainTiles = 0;
        for (const row of array) {
            for (const tile of row) {
                if (tile < TileType.Wall) {
                    nTerrainTiles++;
                }
            }
        }
        if (!(nTerrainTiles > array.length ** 2 / 2)) {
            this.errorMessages.push('- Au moins la moitié des tuiles doivent être couverts de tuiles de terrain (gazon, eau, glace, eau)');
        }
    }

    private validateAllDoors(array: number[][]) {
        for (let row = 0; row < array.length; row++) {
            for (let col = 0; col < array[row].length; col++) {
                if (array[row][col] > TileType.Wall && !this.isDoorPlacementValid(array, row, col)) {
                    this.errorMessages.push("- Au moins une porte n'est pas valide: ");
                    this.errorMessages.push("Chacune doit être située entre deux murs sur un axe, et entre deux tuiles de terrain sur l'autre.");
                }
            }
        }
    }

    private isDoorPlacementValid(array: number[][], row: number, col: number): boolean {
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

    private validateAllSpawnPointsPlaced(game: Game) {
        const spawnObjectCount = this.getNbSpawnPoints(game.itemPlacement);

        if (spawnObjectCount !== game.nbPlayers) {
            this.errorMessages.push('- Tous les points de départ doivent être placés sur la carte.');
        }
    }

    private getNbSpawnPoints(mapObjects: number[][]): number {
        let spawnPoints = 0;
        for (let x = 0; x < mapObjects.length; x++) {
            for (let y = 0; y < mapObjects[x].length; y++) {
                if (mapObjects[x][y] === ObjectType.Spawn) {
                    spawnPoints++;
                }
            }
        }
        return spawnPoints;
    }

    private validateTileAccessibility(array: number[][]) {
        const visited = this.createVisitedArray(array);
        const directions = [...DIRECTIONS];
        const start = this.findStartPoint(array);
        if (start) {
            this.dfs(array, visited, start.row, start.col, directions);
        }
        if (!this.allTilesAccessible(array, visited)) {
            this.errorMessages.push('- Pas toutes les tuiles de terrain sont accessibles');
        }
    }

    private createVisitedArray(array: number[][]): boolean[][] {
        return Array.from({ length: array.length }, () => Array(array[0].length).fill(false));
    }

    private findStartPoint(array: number[][]): { row: number; col: number } | null {
        for (let row = 0; row < array.length; row++) {
            for (let col = 0; col < array[row].length; col++) {
                if (this.isTileAccessible(row, col, array)) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    private isTileAccessible(row: number, col: number, array: number[][]): boolean {
        return array[row][col] !== TileType.Wall;
    }

    private allTilesAccessible(array: number[][], visited: boolean[][]): boolean {
        for (let row = 0; row < array.length; row++) {
            for (let col = 0; col < array[row].length; col++) {
                if (this.isTileAccessible(row, col, array) && !this.isTileVisited(row, col, visited)) {
                    return false;
                }
            }
        }
        return true;
    }

    private dfs(array: number[][], visited: boolean[][], row: number, col: number, directions: { x: number; y: number }[]): void {
        visited[row][col] = true;

        for (const direction of directions) {
            const newRow = row + direction.x;
            const newCol = col + direction.y;

            if (this.isValidMove(newRow, newCol, array, visited)) {
                this.dfs(array, visited, newRow, newCol, directions);
            }
        }
    }

    private validateTitle(title: string) {
        if (!(this.isTitleValidLength(title) && this.containsAcharacter(title))) {
            this.errorMessages.push(
                '- Le titre de la carte doit avoir une longueur entre 3 et 30 caractères et ne pas uniquement contenir des espaces',
            );
        }
    }

    private isTitleValidLength(title: string): boolean {
        return title.length >= MIN_LEN_MAP_TITLE && title.length <= MAX_LEN_MAP_TITLE;
    }

    private containsAcharacter(text: string): boolean {
        return text?.trim() !== '';
    }

    private isValidMove(row: number, col: number, array: number[][], visited: boolean[][]): boolean {
        const isValidRowIndex = row >= 0 && row < array.length;
        const isValidColIndex = col >= 0 && col < array[0].length;
        return isValidRowIndex && isValidColIndex && !this.isTileVisited(row, col, visited) && this.isTileAccessible(row, col, array);
    }

    private isTileVisited(row: number, col: number, visited: boolean[][]): boolean {
        return visited[row][col];
    }

    private validateDescription(description: string) {
        if (!this.isDescriptionValid(description)) {
            this.errorMessages.push(
                '- La description de la carte doit avoir une longueur entre 10 et 128 charactères et ne pas uniquement contenir des espaces',
            );
        }
    }

    private isDescriptionValid(description: string): boolean {
        return description.length >= MIN_LEN_MAP_DESCRIPTION && description.length <= MAX_LEN_MAP_DESCRIPTION && this.containsAcharacter(description);
    }
}
