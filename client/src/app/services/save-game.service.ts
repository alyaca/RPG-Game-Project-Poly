import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP, SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { Info } from '@app/interfaces/info';
import { Map } from '@app/interfaces/map';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SaveGameService {
    apiURL = `${environment.serverUrl}/maps`;

    constructor(private http: HttpClient) {}

    saveGame(informations: Info, selectedMap: Map | null) {
        if (selectedMap == null) {
            let playerNumber = 2;
            switch (informations.height) {
                case SIZE_SMALL_MAP: {
                    playerNumber = NB_ITEMS_SMALL_MAP;
                    break;
                }
                case SIZE_MEDIUM_MAP: {
                    playerNumber = NB_ITEMS_MEDIUM_MAP;
                    break;
                }
                case SIZE_LARGE_MAP: {
                    playerNumber = NB_ITEMS_LARGE_MAP;
                    break;
                }
            }
            const mapToStore = {
                name: informations.name,
                description: informations.description,
                visible: true,
                mode: 'normal', // will have to get it from admin
                nbPlayers: playerNumber,
                image: informations.image,
                tiles: informations.grid,
                dimension: informations.height, // will have to get it from admin, consequently, the nb of players will also change.
                itemPlacement: informations.items,
                isSelected: false,
                lastModification: new Date(),
            };
            return this.http.post(this.apiURL, mapToStore).subscribe();
        } else {
            const mapToReplace = {
                _id: selectedMap._id,
                name: informations.name,
                description: informations.description,
                visible: selectedMap.visible,
                mode: selectedMap.mode,
                nbPlayers: selectedMap.nbPlayers,
                image: informations.image,
                tiles: informations.grid,
                dimension: selectedMap.dimension,
                itemPlacement: informations.items,
                isSelected: false,
                lastModification: new Date(),
            };
            return this.http.put(this.apiURL, mapToReplace).subscribe();
        }
    }
}
