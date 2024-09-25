import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GameObjectComponent } from '@app/components/game-object/game-object.component';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP } from '@app/constants';
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
    @Input() randomItemCount: number;
    @Input() spawnPointCount: number;
    gameObjects: GameObject[];

    mapSize: String = 'small';
    showDescription: boolean = true;
    isSmaller: boolean = false;
    constructor(
        private gameObjectManagerService: GameObjectManagerService, // private dragDropService: DragDropService,
    ) {}

    onDragStart(event: DragEvent, gameObject: GameObject) {
        event.dataTransfer?.setData('text/plain', JSON.stringify(gameObject));
    }

    ngOnInit() {
        this.gameObjectManagerService.objects$.subscribe((data) => {
            this.gameObjects = data;
        });
    }

    getItemCount(itemId: string): number {
        switch (this.mapSize) {
            case 'small':
                if (itemId === 'spawn-point' || itemId === 'random-item') return NB_ITEMS_SMALL_MAP;
                return 0;
            case 'medium':
                if (itemId === 'spawn-point' || itemId === 'random-item') return NB_ITEMS_MEDIUM_MAP;
                return 0;
            case 'large':
                if (itemId === 'spawn-point' || itemId === 'random-item') return NB_ITEMS_LARGE_MAP;
                return 0;
            default:
                return 0;
        }
    }
}
