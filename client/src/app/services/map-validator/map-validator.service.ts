import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import {
    MAX_LEN_MAP_DESCRIPTION,
    MAX_LEN_MAP_TITLE,
    MIN_LEN_MAP_DESCRIPTION,
    MIN_LEN_MAP_TITLE,
    ObjectType,
    VALIDATION_DURATION,
} from '@app/constants';
import { GameListService } from '@app/services/game-list.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { environment } from 'src/environments/environment';

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
    validMap: boolean;
    errorMessages: string[] = [];
    mapObjects: number[][];
    apiURL = `${environment.serverUrl}/maps`;
    constructor(
        private dialog: MatDialog,
        private gameObjectService: GameObjectService,
        public gameListService: GameListService,
    ) {
        this.gameObjectService.initObjectsArray();
    }

    validateMap(array: number[][], title: string, description: string, isNewMap: boolean) {
        this.errorMessages = [];

        if (isNewMap) {
            this.validateName(title);
        }
        this.validateSufficientTerrainTiles(array);
        this.validateAllDoors(array);
        this.validateAllSpawnPointsPlaced();
        this.validateTileAccessibility(array);
        this.validateTitle(title);
        this.validateDescription(description);

        this.showValidationResult();
    }

    showValidationResult() {
        setTimeout(() => {
            const dialogTitle: string = this.errorMessages.length > 0 ? 'Carte invalide' : 'Sauvegarde réussie';

            if (dialogTitle === 'Sauvegarde réussie') {
                this.errorMessages = ["Vous allez être redirigé vers la page d'administration"];
                this.validMap = true;
            } else {
                this.validMap = false;
            }
            this.openDialog(this.errorMessages, dialogTitle);
        }, VALIDATION_DURATION);
    }

    validateName(nameToCheck: string) {
        const trimmedNameToCheck = nameToCheck.trim();
        this.gameListService.getAllGames().subscribe((allMaps) => {
            for (let index in allMaps) {
                if (allMaps[index].name === trimmedNameToCheck) {
                    this.errorMessages.push('- Une carte avec le même nom existe déjà');
                }
            }
        });
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

    validateAllDoors(array: number[][]) {
        for (let row = 0; row < array.length; row++) {
            for (let col = 0; col < array[row].length; col++) {
                if (array[row][col] > TileType.Wall && !this.isDoorPlacementValid(array, row, col)) {
                    this.errorMessages.push("- Au moins une porte n'est pas valide: ");
                    this.errorMessages.push("chacun doit être située entre deux murs sur un axe, et entre deux tuiles de terrain sur l'autre.");
                }
            }
        }
    }

    validateSufficientTerrainTiles(array: number[][]) {
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

    validateTileAccessibility(array: number[][]) {
        const visited = this.createVisitedArray(array);
        const directions = this.getDirections();
        const start = this.findStartPoint(array);
        if (start) {
            this.dfs(array, visited, start.row, start.col, directions);
        }
        if (!this.allTilesAccessible(array, visited)) {
            this.errorMessages.push('- Pas toutes les tuiles de terrain sont accessibles');
        }
    }

    findStartPoint(array: number[][]): { row: number; col: number } | null {
        for (let row = 0; row < array.length; row++) {
            for (let col = 0; col < array[row].length; col++) {
                if (array[row][col] !== TileType.Wall) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    openDialog(errorMessages: string[], title: string) {
        this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: { messages: errorMessages, title },
        });
    }

    containsAcharacter(text: string): boolean {
        return text?.trim() !== '' && text?.trim() !== '';
    }

    validateTitle(title: string) {
        if (!(this.isTitleValidLength(title) && this.containsAcharacter(title))) {
            this.errorMessages.push(
                '- Le titre de la carte doit avoir une longueur entre 3 et 30 caractères et ne pas uniquement contenir des espaces',
            );
        }
    }

    isTitleValidLength(title: string): boolean {
        return title.length >= MIN_LEN_MAP_TITLE && title.length <= MAX_LEN_MAP_TITLE;
    }

    validateDescription(description: string) {
        if (!this.isDescriptionValid(description)) {
            this.errorMessages.push(
                '- La description de la carte doit avoir une longueur entre 10 et 128 charactères et ne pas uniquement contenir des espaces',
            );
        }
    }

    isDescriptionValid(description: string): boolean {
        return description.length >= MIN_LEN_MAP_DESCRIPTION && description.length <= MAX_LEN_MAP_DESCRIPTION && this.containsAcharacter(description);
    }

    validateAllSpawnPointsPlaced() {
        this.mapObjects = this.gameObjectService.objectsArray;
        const spawnObjectCount = this.countSpawnPoints();

        if (spawnObjectCount !== this.gameObjectService.maxCount) {
            this.errorMessages.push('- Tous les points de départ doivent être placés sur la carte.');
        }
    }

    private createVisitedArray(array: number[][]): boolean[][] {
        return Array.from({ length: array.length }, () => Array(array[0].length).fill(false));
    }

    private getDirections() {
        return [
            { x: 0, y: 1 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
            { x: -1, y: 0 },
        ];
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

    private isValidMove(row: number, col: number, array: number[][], visited: boolean[][]): boolean {
        return row >= 0 && row < array.length && col >= 0 && col < array[0].length && !visited[row][col] && array[row][col] !== TileType.Wall;
    }

    private allTilesAccessible(array: number[][], visited: boolean[][]): boolean {
        for (let row = 0; row < array.length; row++) {
            for (let col = 0; col < array[row].length; col++) {
                if (array[row][col] !== TileType.Wall && !visited[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }

    private countSpawnPoints(): number {
        let spawnObjectCount = 0;
        for (const row of this.mapObjects) {
            for (const cell of row) {
                if (cell === ObjectType.Spawn) {
                    spawnObjectCount++;
                }
            }
        }
        return spawnObjectCount;
    }
}
