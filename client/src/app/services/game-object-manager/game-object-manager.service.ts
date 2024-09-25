import { Injectable } from '@angular/core';
import { GameObject } from '@app/interfaces/gameObject';
import { gameObjects } from '@app/objectsInfo';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameObjectManagerService {
    private objects: GameObject[] = gameObjects;
    private gameObjectsSubject = new BehaviorSubject<GameObject[]>(this.objects);
    objects$ = this.gameObjectsSubject.asObservable();

    getGameObjects(): GameObject[] {
        return this.objects;
    }
}
