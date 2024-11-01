import { Injectable, OnDestroy } from '@angular/core';
import { ITEM_COUNT, NO_OBJECT, OBJECT_COUNT_MAP, ObjectType, TileType } from '@app/constants';
import { GameObject } from '@app/interfaces/game-object';
import { MapPosition } from '@app/interfaces/map-position';
import { gameObjects } from '@app/objects-info';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { Subscription } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameObjectService implements OnDestroy {
    draggedObject: GameObject | null = null;
    dragStartPosition: MapPosition | null = null;
    isDraggingFromContainer: boolean = false;
    maxCount: number;
    objects: GameObject[] = gameObjects;
    objectsArray: number[][];
    selectedTile: MapPosition | null = null;
    private countableObjects = [ObjectType.Random, ObjectType.Spawn];
    private gridSize: number;
    private mapSize: string | null;
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

    checkGameObject(row: number, col: number) {
        const gameObject = this.getGameObjectOnTile(row, col);
        if (gameObject) {
            this.draggedObject = gameObject;
        }
    }

    isValidTileForObject(row: number, col: number, tiles: number[][]): boolean {
        const validTileType = [TileType.Ground, TileType.Ice, TileType.Water];
        return validTileType.includes(tiles[row][col]);
    }

    onDrop(event: DragEvent, row: number, col: number, objects: number[][], tiles: number[][]) {
        event.preventDefault();
        if (this.draggedObject && objects[row][col] === NO_OBJECT && this.isValidTileForObject(row, col, tiles)) {
            this.updateObjectGridPosition(this.draggedObject, row, col);
        }
    }

    handleGameObjectOnTile(row: number, col: number, tiles: number[][]) {
        const gameObject = this.getGameObjectOnTile(row, col);
        if (gameObject && gameObject?.id !== 0 && !this.isValidTileForObject(row, col, tiles)) {
            this.selectedTile = { row, col };
            this.removeObjectFromGrid(gameObject);
        }
    }

    onDragStart(row: number, col: number) {
        this.selectedTile = null;
        this.dragStartPosition = { row, col };
        this.checkGameObject(row, col);
    }

    private resetDrag() {
        this.dragStartPosition = null;
        this.draggedObject = null;
    }
}
