import { Injectable } from '@angular/core';
import { Map } from '@app/interfaces/map';

@Injectable({
    providedIn: 'root',
})
export class GameGridService {
    hasMapToEditSubject: boolean = false;
    mapToEdit: Map;

    setMapToEdit(map: Map) {
        this.mapToEdit = map;
        this.hasMapToEditSubject = true;
    }
}
