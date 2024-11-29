import { Injectable } from '@angular/core';
import {
    DIRECTIONS,
    ErrorMessages,
    MAX_LEN_MAP_DESCRIPTION,
    MAX_LEN_MAP_TITLE,
    MAX_PLAYER_LARGE_MAP,
    MAX_PLAYER_MEDIUM_MAP,
    MAX_PLAYER_SMALL_MAP,
    MIN_LEN_MAP_DESCRIPTION,
    MIN_LEN_MAP_TITLE,
    NO_OBJECT,
    OBJECT_COUNT_MAP,
    SIZE_LARGE_MAP,
    SIZE_MEDIUM_MAP,
    SIZE_SMALL_MAP,
} from '@app/constants';
import { GameListService } from '@app/services/game-list/game-list.service';
import { MapValidatorService } from '@app/services/map-validator/map-validator.service';
import { ObjectType } from '@common/avatars-info';
import { GameMode, TileType } from '@common/constants';
import { Game } from '@common/interfaces/game';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameImportValidatorService {
    errorMessages: string[] = [];
    validMap: boolean;

    constructor(
        private gameListService: GameListService,
        private mapValidatorService: MapValidatorService,
    ) {}

    async validateMap(game: Game): Promise<string[]> {
        this.errorMessages = [];
        this.validateSufficientTerrainTiles(game.tiles);
        this.validateAllDoors(game.tiles);
        this.validateAllSpawnPointsPlaced(game);
        this.validateTiles(game.tiles);
        this.validateObjects(game.itemPlacement, game.dimension);
        this.validateTileAccessibility(game.tiles);
        this.validateTitle(game.name.trim());
        this.validateDimensions(game.tiles, game.itemPlacement, game.dimension);
        this.validateDescription(game.description);
        this.validateMode(game.mode);
        this.validateNbPlayers(game.nbPlayers, game.dimension);

        await this.validateName(game.name);

        return this.errorMessages;
    }

    private async validateName(nameToCheck: string): Promise<void> {
        const trimmedNameToCheck = nameToCheck.trim();
        const allMaps = await firstValueFrom(this.gameListService.getAllGames());
        for (const map of allMaps) {
            if (map.name.trim() === trimmedNameToCheck) {
                this.errorMessages.push(ErrorMessages.NameAlreadyExists);
                break;
            }
        }
    }

    private validateDimensions(tiles: number[][], itemPlacement: number[][], dimensions: number) {
        const mapRowSize = tiles.length;
        const mapColSize = tiles[0].length;
        const itemPlacementRowSize = itemPlacement.length;
        const itemPlacementColSize = itemPlacement[0].length;
        const isDimensionValid = dimensions === SIZE_SMALL_MAP || dimensions === SIZE_MEDIUM_MAP || dimensions === SIZE_LARGE_MAP;
        const isMapSizeRowValid = isDimensionValid ? mapRowSize === dimensions : false;
        const isMapSizeColValid = isDimensionValid ? mapColSize === dimensions : false;
        const isItemPlacementRowSizeValid = isDimensionValid ? itemPlacementRowSize === dimensions : false;
        const isItemPlacementColSizeValid = isDimensionValid ? itemPlacementColSize === dimensions : false;
        const isMapSizeValid = isMapSizeRowValid && isMapSizeColValid;
        const isItemPlacementValid = isItemPlacementRowSizeValid && isItemPlacementColSizeValid;
        if (!isMapSizeValid || !isItemPlacementValid) {
            this.errorMessages.push(ErrorMessages.InvalidTilesDimensions);
        }
        if (!isDimensionValid) {
            this.errorMessages.push(ErrorMessages.InvalidDimension);
        }
    }

    private validateTiles(tiles: number[][]) {
        tiles.forEach((row) => {
            row.forEach((tile) => {
                if (tile < TileType.Ground || tile > TileType.OpenDoor) {
                    this.errorMessages.push(ErrorMessages.InvalidTileType);
                    return;
                }
            });
        });
    }

    private validateObjects(itemPlacement: number[][], dimension: number) {
        let objectCount = 0;
        itemPlacement.forEach((row) => {
            row.forEach((item) => {
                if (item < NO_OBJECT || (item > ObjectType.Spawn && item !== ObjectType.Flag)) {
                    this.errorMessages.push(ErrorMessages.InvalidObjectType);
                    return;
                }
                if (item > NO_OBJECT && (item < ObjectType.Spawn || item === ObjectType.Flag)) {
                    objectCount++;
                }
            });
        });

        if (dimension === SIZE_SMALL_MAP) {
            if (objectCount !== OBJECT_COUNT_MAP.small) {
                this.errorMessages.push(ErrorMessages.InvalidNbObjects);
            }
        } else if (dimension === SIZE_MEDIUM_MAP) {
            if (objectCount > OBJECT_COUNT_MAP.medium || objectCount < OBJECT_COUNT_MAP.small) {
                this.errorMessages.push(ErrorMessages.InvalidNbObjects);
            }
        } else if (dimension === SIZE_LARGE_MAP) {
            if (objectCount > OBJECT_COUNT_MAP.large || objectCount < OBJECT_COUNT_MAP.small) {
                this.errorMessages.push(ErrorMessages.InvalidNbObjects);
            }
        }
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
                if (
                    array[row][col] > TileType.Wall &&
                    array[row][col] <= TileType.OpenDoor &&
                    !this.mapValidatorService.isDoorPlacementValid(array, row, col)
                ) {
                    this.errorMessages.push("- Au moins une porte n'est pas valide: ");
                    this.errorMessages.push("Chacune doit être située entre deux murs sur un axe, et entre deux tuiles de terrain sur l'autre.");
                }
            }
        }
    }

    private validateAllSpawnPointsPlaced(game: Game) {
        const spawnObjectCount = this.getNbSpawnPoints(game.itemPlacement);

        if (spawnObjectCount !== game.nbPlayers) {
            this.errorMessages.push('- Tous les points de départ doivent être placés sur la carte.');
        }
    }

    private getNbSpawnPoints(mapObjects: number[][]): number {
        let spawnPoints = 0;
        for (const row of mapObjects) {
            for (const cell of row) {
                if (cell === ObjectType.Spawn) {
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
            this.errorMessages.push(ErrorMessages.TitleInvalidLength);
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

    private validateMode(mode: string) {
        if (mode !== GameMode.Classic && mode !== GameMode.CaptureTheFlag) {
            this.errorMessages.push(ErrorMessages.InvalidMode);
        }
    }

    private validateNbPlayers(nbPlayers: number, dimension: number) {
        if (dimension === SIZE_SMALL_MAP) {
            if (nbPlayers !== MAX_PLAYER_SMALL_MAP) {
                this.errorMessages.push(ErrorMessages.InvalidNbPlayers);
            }
        } else if (dimension === SIZE_MEDIUM_MAP) {
            if (nbPlayers < MAX_PLAYER_SMALL_MAP || nbPlayers > MAX_PLAYER_MEDIUM_MAP) {
                this.errorMessages.push(ErrorMessages.InvalidNbPlayers);
            }
        } else if (dimension === SIZE_LARGE_MAP) {
            if (nbPlayers < MAX_PLAYER_SMALL_MAP || nbPlayers > MAX_PLAYER_LARGE_MAP) {
                this.errorMessages.push(ErrorMessages.InvalidNbPlayers);
            }
        }
    }

    private isDescriptionValid(description: string): boolean {
        return description.length >= MIN_LEN_MAP_DESCRIPTION && description.length <= MAX_LEN_MAP_DESCRIPTION && this.containsAcharacter(description);
    }
}
