import { Injectable, OnDestroy } from '@angular/core';
import { ITEM_COUNT, NO_OBJECT, ObjectType, MAX_OBJ_COUNT_COEFF_1, MAX_OBJ_COUNT_COEFF_2 } from '@app/constants';
import { GameObject } from '@app/interfaces/gameObject';
import { gameObjects } from '@app/objectsInfo';
import { GameCreationService } from '@app/services/game-creation.service';
import { GameGridService } from '@app/services/game-grid.service';
import { Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameObjectService implements OnDestroy {
    countableObjects = [ObjectType.Random, ObjectType.Spawn];
    draggedObject: GameObject | null = null;
    dragStartPosition: { row: number; col: number } | null = null;
    gridSize: number;
    isDraggingFromContainer: boolean = false;
    objects: GameObject[] = gameObjects;
    objectsArray: number[][];
    maxCount: number;
    selectedTile: { row: number; col: number } | null = null;
    private sizeSubscription!: Subscription;

    constructor(
        private gameCreationService: GameCreationService,
        private gameGridService: GameGridService,
    ) {
        this.sizeSubscription = this.gameCreationService.sizeSubject.subscribe(() => {
            this.gridSize = this.gameCreationService.updateDimensions() as number;
        });
    }

    findMaxObjCount(mapSize: number): number {
        return MAX_OBJ_COUNT_COEFF_1 * mapSize - MAX_OBJ_COUNT_COEFF_2;
    }

    createNewObjectsArray() {
        this.objectsArray = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(NO_OBJECT));
        this.maxCount = this.findMaxObjCount(this.gridSize);

        return this.objectsArray;
    }

    resetObjectsCount() {
        this.objects.forEach((object) => {
            if (this.countableObjects.includes(object.id) && this.gridSize) {
                object.count = this.findMaxObjCount(this.gridSize);
            } else {
                object.count = ITEM_COUNT;
            }
        });
    }

    updateObjectsContainer(objectsArray: number[][], objectsInfo: GameObject[]) {
        this.gridSize = this.gameGridService.mapToEdit.dimension;
        this.objectsArray = objectsArray;
        this.maxCount = this.findMaxObjCount(this.gridSize);
        this.resetObjectsCount();

        for (const row of objectsArray) {
            for (const tileId of row) {
                if (tileId > 0) {
                    const object = objectsInfo.find((obj) => obj.id === tileId);
                    if (object && object.count > 0) {
                        object.count--;
                    }
                }
            }
        }
    }

    getObjectById(id: number): GameObject | undefined {
        return this.objects.find((obj) => obj.id === id);
    }

    getGameObjectOnTile(row: number, col: number) {
        const gameObjectId = this.objectsArray[row][col];
        return this.getObjectById(gameObjectId);
    }

    updateObjectGridPosition(gameObject: GameObject, row: number, col: number, objectsArray: number[][]) {
        if (this.dragStartPosition) {
            objectsArray[this.dragStartPosition.row][this.dragStartPosition.col] = NO_OBJECT;
        } else {
            gameObject.count--;
        }
        objectsArray[row][col] = gameObject.id;
        this.resetDrag();
    }

    removeObjectFromGrid(gameObject: GameObject) {
        if (this.selectedTile) {
            this.objectsArray[this.selectedTile.row][this.selectedTile.col] = NO_OBJECT;
        } else if (this.dragStartPosition) {
            this.objectsArray[this.dragStartPosition.row][this.dragStartPosition.col] = NO_OBJECT;
        }
        const maxObjectCount = this.countableObjects.includes(gameObject.id) ? this.maxCount : ITEM_COUNT;
        if (gameObject.count + 1 <= maxObjectCount) {
            gameObject.count++;
        }
        this.resetDrag();
    }

    removeObjectByClick(event: MouseEvent, row: number, col: number) {
        event.preventDefault();
        this.selectedTile = { row, col };
        const gameObject = this.getGameObjectOnTile(row, col);

        if (gameObject?.id !== NO_OBJECT && gameObject) {
            this.removeObjectFromGrid(gameObject);
        }
    }

    resetDrag() {
        this.dragStartPosition = null;
        this.draggedObject = null;
    }

    ngOnDestroy(): void {
        if (this.sizeSubscription) {
            this.sizeSubscription.unsubscribe();
        }
    }
}
