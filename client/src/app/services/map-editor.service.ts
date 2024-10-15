import { inject, Injectable } from '@angular/core';
import { GameObject } from '@app/interfaces/gameObject';
import { Map } from '@app/interfaces/map';
import { GameCreationService } from '@app/services/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { MapValidatorService } from '@app/services/map-validator/map-validator.service';
@Injectable({
    providedIn: 'root',
})
export class MapEditorService {
    private mapValidator = inject(MapValidatorService);
    private gameObjectService = inject(GameObjectService);
    private gameCreationService = inject(GameCreationService);
    mapToEdit: Map;

    constructor() {}

    getGridSize() {
        return this.gameCreationService.getStoredSize();
    }

    isMapChosen() {
        if (this.gameCreationService.sizeSubject.value) {
            return this.gameCreationService.sizeSubject.value;
        }
        return this.mapToEdit;
    }

    onDragEnd() {
        this.gameObjectService.isDraggingFromContainer = false;
    }

    removeObjectFromGrid(gameObject: GameObject) {
        this.gameObjectService.removeObjectFromGrid(gameObject);
    }

    isDraggingFromContainer() {
        return this.gameObjectService.isDraggingFromContainer;
    }

    getDraggedObject() {
        return this.gameObjectService.draggedObject;
    }

    isMapValid() {
        return this.mapValidator.validMap;
    }
    setMapToEdit(map: Map) {
        this.mapToEdit = map;
    }
}
