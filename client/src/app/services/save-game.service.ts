import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SaveGameService {
    private apiURL = `${environment.serverUrl}`;

    constructor(private http: HttpClient) {}

    startPutRequest(gameToSave: Game) {
        return this.http.put(this.apiURL, gameToSave);
    }

    startPostRequest(gameToSave: Game) {
        return this.http.post(this.apiURL, gameToSave);
    }
}
