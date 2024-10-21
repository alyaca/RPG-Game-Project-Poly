import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@common/game';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameListService {
    selectedGameSubject = new BehaviorSubject<Game | null>(null);
    chosenGameSubject = new BehaviorSubject<Game | null>(null);
    private allMapsApiUrl = `${environment.serverUrl}/maps`;
    private visibleMapsUrl = `${this.allMapsApiUrl}/visible`;

    constructor(private http: HttpClient) {}

    getGames(usingPage: string) {
        if (usingPage === 'game-list') {
            return this.getAllVisibleGames();
        } else {
            return this.getAllGames();
        }
    }

    getAllVisibleGames() {
        return this.http.get<Game[]>(this.visibleMapsUrl);
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

    checkIfGameExists(game: Game): Observable<boolean> {
        return this.getAllGames().pipe(
            map((games: Game[]) => games.some((g) => g._id === game._id)),
            catchError(() => {
                return of(false);
            }),
        );
    }

    checkIfVisibleGameExists(game: Game): Observable<Game | null> {
        return this.getAllVisibleGames().pipe(
            map((games: Game[]) => games.find((g) => g._id === game._id) || null),
            catchError(() => {
                return of(null);
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
