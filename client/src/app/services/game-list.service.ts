import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameListService {
    selectedGame$: Observable<Game | null>;

    private selectedGameSubject = new BehaviorSubject<Game | null>(null);
    private allMapsApiUrl = `${environment.serverUrl}/maps`;

    constructor(private http: HttpClient) {
        this.selectedGame$ = this.selectedGameSubject.asObservable();
    }

    getGames(usingPage: string) {
        if (usingPage === 'game-list') {
            return this.getAllVisibleMaps();
        } else {
            return this.getAllGames();
        }
    }

    getAllVisibleMaps() {
        const apiUrl = `${this.allMapsApiUrl}/visible`;
        return this.http.get<Game[]>(`${apiUrl}`).pipe(
            map((maps: Game[]) => {
                return maps.map((game: Game) => ({
                    ...game,
                    dimension: `${game.dimension}x${game.dimension}`,
                }));
            }),
        );
    }

    getAllGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.allMapsApiUrl}`);
    }

    setSelectedGame(usingPage: string, game: Game, games: Game[]) {
        if (usingPage === 'game-list') {
            if (game.isSelected) {
                this.deselectGame(games);
            } else {
                this.selectGame(game, games);
            }
        }
    }

    selectGame(game: Game, games: Game[]) {
        this.deselectGame(games);
        this.selectedGameSubject.next(game);
        game.isSelected = true;
    }

    deselectGame(games: Game[]) {
        this.selectedGameSubject.next(null);
        games.forEach((game) => (game.isSelected = false));
    }

    performChangeVisibility(game: Game): Observable<boolean> {
        const newVisibleValue = !game.visible;
        const url = `${this.allMapsApiUrl}/${game._id}`;
        const updateData = { visible: newVisibleValue };
        return this.http.patch<Game>(url, updateData).pipe(
            map((updatedGame) => {
                game.visible = updatedGame.visible;
                return true;
            }),
            catchError(() => {
                return of(false);
            }),
        );
    }

    changeVisibility(game: Game): Observable<boolean> {
        return this.checkIfGameExists(game).pipe(
            switchMap((exists) => {
                if (exists) {
                    return this.performChangeVisibility(game);
                } else {
                    return of(false);
                }
            }),
        );
    }

    deleteGame(game: Game): Observable<boolean> {
        return this.checkIfGameExists(game).pipe(
            switchMap((exists) => {
                if (exists) {
                    return this.performDeleteGame(game);
                } else {
                    return of(false);
                }
            }),
        );
    }

    private checkIfGameExists(game: Game): Observable<boolean> {
        return this.getAllGames().pipe(
            map((games: Game[]) => games.some((g) => g._id === game._id)),
            catchError(() => {
                return of(false);
            }),
        );
    }

    private performDeleteGame(game: Game): Observable<boolean> {
        return this.http.delete<void>(`${this.allMapsApiUrl}/${game._id}`).pipe(
            map(() => true),
            catchError(() => of(false)),
        );
    }
}
