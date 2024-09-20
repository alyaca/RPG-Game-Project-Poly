import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GameObjectComponent } from '@app/components/game-object/game-object.component';
import { GameObject } from '@app/interfaces/gameObject';
import { gameObjects } from '@app/objectsInfo';

@Component({
    selector: 'app-editor-objects-container',
    standalone: true,
    templateUrl: './editor-objects-container.component.html',
    styleUrls: ['./editor-objects-container.component.scss'],
    imports: [FormsModule, RouterLink, GameObjectComponent],
})
export class EditorObjectsContainerComponent {
    @Input() randomItemCount: number;
    @Input() spawnPointCount: number;
    objects: GameObject[] = gameObjects;

    onCountChange(event: { id: string; count: number }): void {
        const item = this.objects.find((obj) => obj.id === event.id);
        if (item) {
            item.count = event.count;
        }
    }
}
