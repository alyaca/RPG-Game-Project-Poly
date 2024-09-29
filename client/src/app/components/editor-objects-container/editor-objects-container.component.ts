import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GameObjectComponent } from '@app/components/game-object/game-object.component';
import { GameObject } from '@app/interfaces/gameObject';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { ToolButtonService } from '@app/services/tool-button.service';

@Component({
    selector: 'app-editor-objects-container',
    standalone: true,
    templateUrl: './editor-objects-container.component.html',
    styleUrls: ['./editor-objects-container.component.scss'],
    imports: [FormsModule, RouterLink, GameObjectComponent, CommonModule],
})
export class EditorObjectsContainerComponent implements OnInit {
    gameObjects: GameObject[];
    isDraggingFromContainer: boolean = false;
    mapSize: string = 'small';
    showDescription: boolean = true;

    constructor(
        private gameObjectService: GameObjectService,
        private toolButtonService: ToolButtonService,
    ) {}

    ngOnInit() {
        this.gameObjects = this.gameObjectService.objects;
        this.gameObjectService.resetObjectsCount();
    }

    onDragStart(event: DragEvent, gameObject: GameObject) {
        if (this.toolButtonService.selectedButton) {
            this.toolButtonService.selectedButton.toggleActivation();
            this.toolButtonService.selectedButton = null;
        }

        if (gameObject.count === 0) {
            event.preventDefault();
            return;
        }
        this.gameObjectService.draggedObject = gameObject;
        this.isDraggingFromContainer = true;
    }

    onDragEnd() {
        this.isDraggingFromContainer = false;
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent, gameObjectId: number) {
        event.preventDefault();
        const gameObject = this.gameObjectService.draggedObject;
        if (this.isDraggingFromContainer) {
            return;
        }
        if (gameObject?.id === gameObjectId) {
            this.gameObjectService.removeObjectFromGrid(gameObject);
        }
    }
}
