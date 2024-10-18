import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP, SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { Info } from '@app/interfaces/info';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SaveGameService {
    apiURL = `${environment.serverUrl}/maps`;

    constructor(private http: HttpClient) {}

    saveNewGame(informations: Info) {
        const playerNumber = this.getPlayerNumber(informations.height);
        const mapToStore = this.createMapObject(informations, playerNumber, '');
        return this.http.post(this.apiURL, mapToStore).subscribe();
    }

    replaceMap(informations: Info, id: String) {
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

    private createMapObject(informations: Info, playerNumber: number, id: String | null): unknown {
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
}
