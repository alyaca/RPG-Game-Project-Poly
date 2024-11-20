import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP, SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { Info } from '@app/interfaces/info';
import { Game } from '@common/game';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GameImportValidatorService } from '../game-import-validator.service';

@Injectable({
    providedIn: 'root',
})
export class SaveGameService {
    apiURL = `${environment.serverUrl}/maps`;

    constructor(
        private http: HttpClient,
        private gameImportValidatorService: GameImportValidatorService,
    ) {}

    saveNewGame(informations: Info) {
        const playerNumber = this.getPlayerNumber(informations.height);
        const mapToStore = this.createMapObject(informations, playerNumber, '');
        return this.http.post(this.apiURL, mapToStore).subscribe();
    }

    replaceMap(informations: Info, id: string) {
        const playerNumber = this.getPlayerNumber(informations.height);
        const mapToReplace = this.createMapObject(informations, playerNumber, id);
        return this.http.put(this.apiURL, mapToReplace).subscribe();
    }

    private getPlayerNumber(height: number): number {
        switch (height) {
            case SIZE_SMALL_MAP:
                return NB_ITEMS_SMALL_MAP;
            case SIZE_MEDIUM_MAP:
                return NB_ITEMS_MEDIUM_MAP;
            case SIZE_LARGE_MAP:
                return NB_ITEMS_LARGE_MAP;
            default:
                throw new Error('Taille de carte invalide');
        }
    }

    private createMapObject(informations: Info, playerNumber: number, id: string | null) {
        if (id) {
            return {
                _id: id,
                name: informations.name,
                description: informations.description,
                visible: false,
                mode: 'normal',
                nbPlayers: playerNumber,
                image: informations.image,
                tiles: informations.grid,
                dimension: informations.height,
                itemPlacement: informations.items,
                isSelected: false,
                lastModification: new Date(),
            };
        }
        return {
            name: informations.name,
            description: informations.description,
            visible: false,
            mode: 'normal',
            nbPlayers: playerNumber,
            image: informations.image,
            tiles: informations.grid,
            dimension: informations.height,
            itemPlacement: informations.items,
            isSelected: false,
            lastModification: new Date(),
        };
    }

    importGame(file: File): Observable<Game | string[]> {
        return new Observable((observer) => {
            const reader = new FileReader();

            reader.onload = () => {
                try {
                    const gameData: Game = JSON.parse(reader.result as string);

                    this.gameImportValidatorService.validateMap(gameData).then((errorMessages) => {
                        if (errorMessages.length === 0) {
                            const gameInfo: Info = this.cleanData(gameData);
                            this.saveImportedGame(gameInfo)
                                .pipe(
                                    tap((createdGame) => {
                                        observer.next(createdGame as Game);
                                        observer.complete();
                                    }),
                                    catchError((error) => {
                                        observer.error(["Erreur lors de l'enregistrement du jeu : " + error.message]);
                                        return throwError(() => new Error(error));
                                    }),
                                )
                                .subscribe();
                        } else {
                            observer.next(errorMessages);
                            observer.complete();
                        }
                    });
                } catch (error) {
                    observer.error(['Erreur lors de la lecture du fichier JSON.']);
                }
            };

            reader.onerror = () => {
                observer.error(['Erreur de lecture du fichier.']);
            };

            reader.readAsText(file);
        });
    }

    cleanData(game: Game): Info {
        const info: Info = {
            image: game.image,
            name: game.name,
            description: game.description,
            grid: game.tiles,
            items: game.itemPlacement,
            height: game.dimension,
        };
        return info;
    }

    saveImportedGame(informations: Info) {
        const playerNumber = this.getPlayerNumber(informations.height);
        const mapToStore = this.createMapObject(informations, playerNumber, '');
        return this.http.post(this.apiURL, mapToStore);
    }
}
