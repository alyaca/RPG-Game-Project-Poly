import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-editor-objects-container',
    standalone: true,
    templateUrl: './editor-objects-container.component.html',
    styleUrls: ['./editor-objects-container.component.scss'],
    imports: [FormsModule, RouterLink],
})
export class EditorObjectsContainerComponent {
    @Input() randomItemCount: number = 0;
    @Input() spawnPointCount: number = 0;
    gameObjects = [
        {
            id: 'item-1',
            name: 'Trident de Poséidon',
            image: 'assets/images/objects/poseidon-trident.jpg',
            description: 'Changement de dé : 1, 2, 3, 5, 6, 6',
        },
        { id: 'item-2', name: 'Achille', image: 'assets/images/objects/poseidon-trident.jpg', description: 'Description 2' },
        { id: 'item-3', name: 'Pandora', image: 'assets/images/objects/poseidon-trident.jpg', description: 'Description 3' },
        { id: 'item-4', name: 'Zeus', image: 'assets/images/objects/poseidon-trident.jpg', description: 'Description 4' },
        { id: 'item-5', name: 'Xiphos', image: 'assets/images/objects/poseidon-trident.jpg', description: 'Description 5' },
        { id: 'item-6', name: 'Lyre', image: 'assets/images/objects/poseidon-trident.jpg', description: 'Description 6' },
        { id: 'random-item', name: 'Random Item', image: 'assets/images/objects/poseidon-trident.jpg', description: 'Random item', count: 2 },
        { id: 'spawn-point', name: 'Point de départ', image: 'assets/images/objects/poseidon-trident.jpg', description: 'Spawn point', count: 2 },
    ]; // temporary data structure
}
