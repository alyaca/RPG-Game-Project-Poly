import { Injectable } from '@angular/core';
import { ITEM_COUNT, NO_OBJECT, OBJECT_COUNT_MAP, ObjectType, SIZE_SMALL_MAP } from '@app/constants';
import { GameObject } from '@app/interfaces/gameObject';
import { gameObjects } from '@app/objectsInfo';

@Injectable({
    providedIn: 'root',
})
export class GameObjectService {
    objects: GameObject[] = gameObjects;
    dragStartPosition: { row: number; col: number } | null = null;
    selectedTile: { row: number; col: number } | null = null;
    draggedObject: GameObject | null = null;
    height: number = SIZE_SMALL_MAP;
    width: number = SIZE_SMALL_MAP;
    objectsArray: number[][];
    maxCount: number;
    countableObjects = [ObjectType.Random, ObjectType.Spawn];

    initObjectsArray(mapSize: number) {
        this.objectsArray = Array.from({ length: mapSize }, () => Array(mapSize).fill(NO_OBJECT));
        this.maxCount = OBJECT_COUNT_MAP['small']; // voir avec le service de kimia
        return this.objectsArray;
    }

    resetObjectsCount() {
        this.objects.forEach((object) => {
            if (this.countableObjects.includes(object.id)) {
                object.count = OBJECT_COUNT_MAP['small']; // voir avec le service
            } else {
                object.count = ITEM_COUNT;
            }
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
}
