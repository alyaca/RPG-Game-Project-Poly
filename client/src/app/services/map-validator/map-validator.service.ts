import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import {
    DIRECTIONS,
    MAX_LEN_MAP_DESCRIPTION,
    MAX_LEN_MAP_TITLE,
    MIN_LEN_MAP_DESCRIPTION,
    MIN_LEN_MAP_TITLE,
    MIN_NB_ITEMS,
    NB_ITEMS_LARGE_MAP,
    NB_ITEMS_MEDIUM_MAP,
    NB_ITEMS_SMALL_MAP,
    SIZE_LARGE_MAP,
    SIZE_MEDIUM_MAP,
    SIZE_SMALL_MAP,
    VALIDATION_DURATION,
} from '@app/constants';
import { ValidatingMapInfo } from '@app/interfaces/validating-map-info';
import { GameListService } from '@app/services/game-list/game-list.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { ObjectType } from '@common/avatars-info';
import { TileType } from '@common/constants';

@Injectable({
    providedIn: 'root',
})
export class MapValidatorService {
    validMap: boolean;
    private errorMessages: string[] = [];
    private mapObjects: number[][];

    constructor(
        private dialog: MatDialog,
        private gameObjectService: GameObjectService,
        private gameListService: GameListService,
    ) {
        this.gameObjectService.initObjectsArray();
    }

    validateMap(validationInfo: ValidatingMapInfo) {
        this.errorMessages = [];
        if (validationInfo.isNewMap || validationInfo.oldMapName !== validationInfo.title) {
            this.validateName(validationInfo.title);
        }
        this.validateSufficientTerrainTiles(validationInfo.tiles);
        this.validateAllDoors(validationInfo.tiles);
        this.validateAllSpawnPointsPlaced();
        this.validateTileAccessibility(validationInfo.tiles);
        this.validateTitle(validationInfo.title);
        this.validateDescription(validationInfo.description);
        this.validateNumberItems(validationInfo.objects);

        this.showValidationResult();
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

    private validateNumberItems(objects: number[][]) {
        let maxNbItems: number;
        let currentNumberItems = 0;
        switch (objects.length) {
            case SIZE_SMALL_MAP:
                maxNbItems = NB_ITEMS_SMALL_MAP;
                break;
            case SIZE_MEDIUM_MAP:
                maxNbItems = NB_ITEMS_MEDIUM_MAP;
                break;
            case SIZE_LARGE_MAP:
                maxNbItems = NB_ITEMS_LARGE_MAP;
                break;
            default:
                maxNbItems = NB_ITEMS_MEDIUM_MAP;
                break;
        }

        for (const objectsRows of objects) {
            for (const individualItem of objectsRows) {
                if (individualItem >= ObjectType.Trident && individualItem <= ObjectType.Random) {
                    currentNumberItems += 1;
                }
            }
        }

        if (currentNumberItems > maxNbItems) {
            this.errorMessages.push(`- Il y a trop d'objets sur cette carte. ${currentNumberItems} objets au lieu de ${maxNbItems}.`);
        }

        if (currentNumberItems < MIN_NB_ITEMS) {
            this.errorMessages.push(
                `Il n'y a pas assez d'objets sur la carte. Le minimum est ${MIN_NB_ITEMS} et il y en a présentement ${currentNumberItems}.`,
            );
        }
    }

    private showValidationResult() {
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

    private validateName(nameToCheck: string) {
        const trimmedNameToCheck = nameToCheck.trim();
        this.gameListService.getAllGames().subscribe((allMaps) => {
            for (const index in allMaps) {
                if (allMaps[index].name === trimmedNameToCheck) {
                    this.errorMessages.push('- Une carte avec le même nom existe déjà');
                }
            }
        });
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

    private openDialog(errorMessages: string[], title: string) {
        this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: { messages: errorMessages, title },
        });
    }

    private containsAcharacter(text: string): boolean {
        return text?.trim() !== '';
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

    private validateAllSpawnPointsPlaced() {
        this.mapObjects = this.gameObjectService.objectsArray;
        const spawnObjectCount = this.countSpawnPoints();

        if (spawnObjectCount !== this.gameObjectService.maxCount) {
            this.errorMessages.push('- Tous les points de départ doivent être placés sur la carte.');
        }
    }

    private createVisitedArray(array: number[][]): boolean[][] {
        return Array.from({ length: array.length }, () => Array(array[0].length).fill(false));
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
        const isValidRowIndex = row >= 0 && row < array.length;
        const isValidColIndex = col >= 0 && col < array[0].length;
        return isValidRowIndex && isValidColIndex && !this.isTileVisited(row, col, visited) && this.isTileAccessible(row, col, array);
    }

    private isTileAccessible(row: number, col: number, array: number[][]): boolean {
        return array[row][col] !== TileType.Wall;
    }

    private isTileVisited(row: number, col: number, visited: boolean[][]): boolean {
        return visited[row][col];
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

export { TileType };
