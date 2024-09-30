import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { MAX_LEN_MAP_DESCRIPTION, MAX_LEN_MAP_TITLE, MIN_LEN_MAP_DESCRIPTION, MIN_LEN_MAP_TITLE, VALIDATION_DURATION } from '@app/constants';
import { Map } from '@app/interfaces/map';
import { map, Observable } from 'rxjs';
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
    apiURL = `${environment.serverUrl}/maps`;
    constructor(
        private dialog: MatDialog,
        private httpClient: HttpClient,
    ) {}

    validateMap(array: number[][], title: string, description: string) {
        this.errorMessages = [];

        this.isSameName(title).subscribe((matchingMapExists: boolean) => {
            if (matchingMapExists) {
                this.errorMessages.push('- Une carte avec le même nom existe déjà');
            }
        });

        if (!this.hasSufficientTerrainTiles(array)) {
            this.errorMessages.push('- Au moins la moitié des tuiles doivent être couverts de tuiles de terrain (gazon, eau, glace, eau)');
        }

        if (!this.validateAllDoors(array)) {
            this.errorMessages.push("- Au moins une porte n'est pas valide: ");
            this.errorMessages.push("chacun doit être située entre deux murs sur un axe, et entre deux tuiles de terrain sur l'autre.");
        }

        if (!this.isEveryTileAccessible(array)) {
            this.errorMessages.push('- Pas toutes les tuiles de terrain sont accessibles');
        }

        if (!this.validateTitleLength(title)) {
            this.errorMessages.push(
                '- Le titre de la carte doit avoir une longueur entre 3 et 30 charactères et ne pas uniquement contenir des espaces',
            );
        }

        if (!this.validateDescriptionLength(description)) {
            this.errorMessages.push(
                '- La description de la carte doit avoir une longueur entre 10 et 256 charactères et ne pas uniquement contenir des espaces',
            );
        }
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

    isSameName(nameToCheck: string): Observable<boolean> {
        const trimmedNameToCheck = nameToCheck.trim();
        return this.httpClient.get<Map[]>(this.apiURL).pipe(
            map((maps: Map[]) => {
                const sameName = maps.filter((g) => g.name.trim() === trimmedNameToCheck);
                return sameName.length > 0;
            }),
        );
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

    openDialog(errorMessages: string[], title: string) {
        this.dialog.open(SimpleDialogComponent, {
            data: { messages: errorMessages, title },
        });
    }

    containsAcharacter(text: string): boolean {
        return text?.trim() !== '' && text?.trim() !== '';
    }

    validateTitleLength(title: string) {
        return title.length >= MIN_LEN_MAP_TITLE && title.length <= MAX_LEN_MAP_TITLE && this.containsAcharacter(title);
    }

    validateDescriptionLength(description: string) {
        return description.length >= MIN_LEN_MAP_DESCRIPTION && description.length <= MAX_LEN_MAP_DESCRIPTION && this.containsAcharacter(description);
    }
}
