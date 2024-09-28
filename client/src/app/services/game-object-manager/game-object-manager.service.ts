import { Injectable } from '@angular/core';
import { NO_OBJECT, SIZE_SMALL_MAP } from '@app/constants';
import { GameObject } from '@app/interfaces/gameObject';
import { gameObjects } from '@app/objectsInfo';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameObjectManagerService {
    objects: GameObject[] = gameObjects;
    private gameObjectsSubject = new BehaviorSubject<GameObject[]>(this.objects);
    dragStartPosition: { row: number; col: number } | null = null;
    selectedTile: { row: number; col: number } | null = null;
    draggedObject: GameObject | null = null;
    height: number = SIZE_SMALL_MAP;
    width: number = SIZE_SMALL_MAP;
    objects$ = this.gameObjectsSubject.asObservable();
    objectsArray: number[][] = Array.from({ length: this.height }, () => Array(this.width).fill(0));

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
        gameObject.count++;
        this.resetDrag();
    }

    resetDrag() {
        this.dragStartPosition = null;
        this.draggedObject = null;
    }
}
