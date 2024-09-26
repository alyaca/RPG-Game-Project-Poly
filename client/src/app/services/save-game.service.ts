import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SaveGameService {
    private apiURL = `${environment.serverUrl}/maps`;

    constructor(private http: HttpClient) {}

    replaceExistingMap(gameToSave: Game) {
        return this.http.put<Game>(this.apiURL, gameToSave);
    }

    addNewGame(gameToSave: Game) {
        return this.http.post<Game>(this.apiURL, gameToSave);
    }
}
