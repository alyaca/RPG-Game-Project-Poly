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

    // temporary data structure
    gameObjects = [
        {
            id: 'item-1',
            name: 'Trident de Poséidon',
            image: 'assets/images/objects/poseidon-trident.jpg',
            description: 'Modifie le dé du joueur qui équipe cet objet : les valeurs équiprobables possibles sont 1, 2, 3, 5, 6, 6',
        },
        {
            id: 'item-2',
            name: 'Armure de Achilles',
            image: 'assets/images/objects/armor-of-achilles.jpg',
            description: '+3 défense',
        },
        {
            id: 'item-3',
            name: 'Sandales ailées',
            image: 'assets/images/objects/winged-sandals.jpg',
            description: 'x2 rapidité si les points de vie actuels du jouer est inférieur ou égal à 33% de ses points de vie totaux',
        },
        { id: 'item-4', name: 'Foudre de Zeus', image: 'assets/images/objects/zeus-lightning.jpg', description: 'x1.5 attaque' },
        {
            id: 'item-5',
            name: 'Xiphos',
            image: 'assets/images/objects/xiphos.jpg',
            description: 'Si les points de vie actuels du joueur qui équipe cet objet est égale ou inférieure à 50% de son PV maximal, +4 attaque',
        },
        {
            id: 'item-6',
            name: 'kunée',
            image: 'assets/images/objects/helm-of-darkness.jpg',
            description: 'vole 1 vie de chaque autre joueur',
        },
        {
            id: 'random-item',
            name: 'Random Item',
            image: 'assets/images/objects/dice.jpg',
            description: 'ajoute un item aléatoire',
            count: 2,
        },
        {
            id: 'spawn-point',
            name: 'Point de départ',
            image: 'assets/images/objects/tree.jpg',
            description: 'désigne le point de départ du jouer',
            count: 2,
        },
    ]; 
}
