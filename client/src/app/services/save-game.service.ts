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

    // Some information will have to be retrieved from the selectedMap coming from admin
    // Some information will have to come from the admin map form creation
    saveGame(informations: Info, selectedMap: Map | null) {
        if (selectedMap == null) {
            let playerNumber;
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
                mode: 'normal',
                nbPlayers: playerNumber,
                image: informations.image,
                tiles: informations.grid,
                dimension: informations.height,
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
