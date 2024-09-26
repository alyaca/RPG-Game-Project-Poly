import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Map } from '@app/interfaces/map';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SaveGameService {
    private apiURL = `${environment.serverUrl}/maps`;

    constructor(private http: HttpClient) {}

    addNewGame(mapToStore: any) {
        return this.http.post(this.apiURL, mapToStore);
    }
    replaceGame(gameId: string, mapToReplace: any) {
        const newMapObject: Map = {
            _id: gameId,
            name: mapToReplace.name,
            description: mapToReplace.description,
            visible: mapToReplace.visible,
            mode: mapToReplace.mode,
            nbPlayers: mapToReplace.nbPlayers,
            image: mapToReplace.image,
            dimension: mapToReplace.dimension,
            tiles: mapToReplace.tiles,
            itemPlacement: mapToReplace.itemPlacement,
            isSelected: mapToReplace.isSelected,
            lastModification: mapToReplace.lastModification,
        };
        return this.http.put(this.apiURL, newMapObject);
    }
}
