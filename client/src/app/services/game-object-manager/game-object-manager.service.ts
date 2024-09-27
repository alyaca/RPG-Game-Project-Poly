import { Injectable } from '@angular/core';
import { GameObject } from '@app/interfaces/gameObject';
import { gameObjects } from '@app/objectsInfo';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameObjectManagerService {
    private objects: GameObject[] = gameObjects;
    private gameObjectsSubject = new BehaviorSubject<GameObject[]>(this.objects);
    private draggedObjectSubject = new BehaviorSubject<GameObject | null>(null);

    objects$ = this.gameObjectsSubject.asObservable();

    getGameObjects(): GameObject[] {
        return this.objects;
    }

    getObjectById(id: number): GameObject | undefined {
        return this.objects.find((obj) => obj.id === id);
    }

    setDraggedObject(gameObject: GameObject): void {
        this.draggedObjectSubject.next(gameObject);
    }

    getDraggedObject(): GameObject | null {
        return this.draggedObjectSubject.value;
    }

    getDraggedObjectObersvable(): Observable<GameObject | null> {
        return this.draggedObjectSubject.asObservable();
    }

    clearDraggedObject(): void {
        this.draggedObjectSubject.next(null);
    }
}
