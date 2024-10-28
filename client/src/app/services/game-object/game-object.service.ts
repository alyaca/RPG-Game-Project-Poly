import { Injectable, OnDestroy } from '@angular/core';
import { ITEM_COUNT, NO_OBJECT, OBJECT_COUNT_MAP, ObjectType } from '@app/constants';
import { GameObject } from '@app/interfaces/game-object';
import { gameObjects } from '@app/objects-info';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
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
    mapSize: string | null;
    maxCount: number;
    selectedTile: { row: number; col: number } | null = null;
    private sizeSubscription!: Subscription;

    constructor(private gameCreationService: GameCreationService) {
        this.sizeSubscription = this.gameCreationService.sizeSubject.subscribe(() => {
            this.mapSize = this.gameCreationService.getStoredSize();
            this.gridSize = this.gameCreationService.updateDimensions() as number;
        });
    }

    initObjectsArray(): number[][] {
        this.objectsArray = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(NO_OBJECT));
        if (this.mapSize) {
            this.maxCount = OBJECT_COUNT_MAP[this.mapSize];
        }
        return this.objectsArray;
    }

    resetObjectsCount() {
        this.objects.forEach((object) => {
            object.count = this.countableObjects.includes(object.id) && this.mapSize ? OBJECT_COUNT_MAP[this.mapSize] : ITEM_COUNT;
        });
    }

    getObjectById(id: number): GameObject | undefined {
        return this.objects.find((obj) => obj.id === id);
    }

    getGameObjectOnTile(row: number, col: number) {
        const gameObjectId = this.objectsArray[row][col];
        return this.getObjectById(gameObjectId);
    }

    updateObjectGridPosition(gameObject: GameObject, row: number, col: number) {
        if (this.dragStartPosition) {
            this.objectsArray[this.dragStartPosition.row][this.dragStartPosition.col] = NO_OBJECT;
        } else {
            gameObject.count--;
        }
        this.objectsArray[row][col] = gameObject.id;
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

    loadMapObjectCount() {
        if (this.mapSize) {
            this.maxCount = OBJECT_COUNT_MAP[this.mapSize];
        }
        this.resetObjectsCount();

        for (const row of this.objectsArray) {
            for (const colValue of row) {
                const object = this.getObjectById(colValue);
                if (colValue !== NO_OBJECT && object) {
                    object.count--;
                }
            }
        }
    }

    ngOnDestroy() {
        if (this.sizeSubscription) {
            this.sizeSubscription.unsubscribe();
        }
    }
}
