import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Map } from '@app/interfaces/map';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameListService {
    selectedGameSubject = new BehaviorSubject<Map | null>(null);
    chosenGameSubject = new BehaviorSubject<Map | null>(null);
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
        return this.http.get<Map[]>(this.visibleMapsUrl);
    }

    getAllGames(): Observable<Map[]> {
        return this.http.get<Map[]>(`${this.allMapsApiUrl}`);
    }

    setSelectedGame(usingPage: string, game: Map, games: Map[]) {
        if (usingPage === 'game-list') {
            if (game.isSelected) {
                this.deselectGame(games);
            } else {
                this.selectGame(game, games);
            }
        }
    }

    selectGame(game: Map, games: Map[]) {
        this.deselectGame(games);
        this.selectedGameSubject.next(game);
        game.isSelected = true;
    }

    deselectGame(games: Map[]) {
        this.selectedGameSubject.next(null);
        games.forEach((game) => (game.isSelected = false));
    }

    performChangeVisibility(game: Map): Observable<boolean> {
        const newVisibleValue = !game.visible;
        const url = `${this.allMapsApiUrl}/${game._id}`;
        const updateData = { visible: newVisibleValue };
        return this.http.patch<Map>(url, updateData).pipe(
            map((updatedGame) => {
                game.visible = updatedGame.visible;
                return true;
            }),
            catchError(() => {
                return of(false);
            }),
        );
    }

    changeVisibility(game: Map): Observable<boolean> {
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

    deleteGame(game: Map): Observable<boolean> {
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

    checkIfGameExists(game: Map): Observable<boolean> {
        return this.getAllGames().pipe(
            map((games: Map[]) => games.some((g) => g._id === game._id)),
            catchError(() => {
                return of(false);
            }),
        );
    }

    checkIfVisibleGameExists(game: Map): Observable<boolean> {
        return this.getAllVisibleGames().pipe(
            map((games: Map[]) => games.some((g) => g._id === game._id)),
            catchError(() => {
                return of(false);
            }),
        );
    }

    private performDeleteGame(game: Map): Observable<boolean> {
        return this.http.delete<void>(`${this.allMapsApiUrl}/${game._id}`).pipe(
            map(() => true),
            catchError(() => of(false)),
        );
    }
}
