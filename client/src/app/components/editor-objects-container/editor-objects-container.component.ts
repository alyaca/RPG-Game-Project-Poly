import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GameObjectComponent } from '@app/components/game-object/game-object.component';
import { OBJECT_COUNT_MAP } from '@app/constants';
import { GameObject } from '@app/interfaces/gameObject';
import { GameObjectManagerService } from '@app/services/game-object-manager/game-object-manager.service';
@Component({
    selector: 'app-editor-objects-container',
    standalone: true,
    templateUrl: './editor-objects-container.component.html',
    styleUrls: ['./editor-objects-container.component.scss'],
    imports: [FormsModule, RouterLink, GameObjectComponent, CommonModule],
})
export class EditorObjectsContainerComponent implements OnInit {
    gameObjects: GameObject[];
    isDragging: boolean = false;
    mapSize: string = 'small';
    showDescription: boolean = true;

    constructor(private gameObjectManagerService: GameObjectManagerService) {}

    ngOnInit() {
        this.gameObjectManagerService.objects$.subscribe((data) => {
            this.gameObjects = data;
        });
        this.setItemCount();
    }

    onDragStart(event: DragEvent, gameObject: GameObject) {
        if (gameObject.count === 0) {
            event.preventDefault();
            return;
        }
        this.gameObjectManagerService.draggedObject = gameObject;
        this.isDragging = true;
    }

    onDragEnd(event: DragEvent) {
        this.isDragging = false;
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent, gameObjectId: number) {
        event.preventDefault();
        const gameObject = this.gameObjectManagerService.draggedObject;
        if (gameObject?.id === gameObjectId) {
            this.gameObjectManagerService.removeObjectFromGrid(gameObject);
        }
    }

    setItemCount() {
        this.gameObjects.forEach((item) => {
            if (item.id === 7 || item.id === 8) {
                item.count = OBJECT_COUNT_MAP[this.mapSize];
            }
        });
    }
}
