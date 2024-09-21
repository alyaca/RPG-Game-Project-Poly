import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameListService {
    selectedGame$: Observable<Game | null>;

    private selectedGameSubject = new BehaviorSubject<Game | null>(null);
    private apiUrl = `${environment.serverUrl}/maps/visible`;
    private allMapsApiUrl = `${environment.serverUrl}/maps`;

    constructor(private http: HttpClient) {
        this.selectedGame$ = this.selectedGameSubject.asObservable();
    }

    getAllVisibleMaps(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.apiUrl}`).pipe(
            map((maps: Game[]) => {
                return maps.map((game: Game) => ({
                    ...game,
                    dimension: `${game.dimension}x${game.dimension}`,
                }));
            }),
        );
    }

    getAllGames() {
        return this.http.get<Game[]>(`${this.allMapsApiUrl}`);
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

    changeVisibility(game: Game) {
        game.visible = !game.visible;
    }
}
