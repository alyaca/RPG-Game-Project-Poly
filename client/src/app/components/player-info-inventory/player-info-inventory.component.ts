import { Component, Input } from '@angular/core';
import { GameObjectComponent } from '@app/components/map-editor/game-object/game-object.component';
import { ObjectType } from '@app/constants';
import { PlayerInfo } from '@app/interfaces/playerInfo';

@Component({
    selector: 'app-player-info-inventory',
    standalone: true,
    imports: [GameObjectComponent, GameObjectComponent],
    templateUrl: './player-info-inventory.component.html',
    styleUrl: './player-info-inventory.component.scss',
})
export class PlayerInfoInventoryComponent {
    // check if when the hp changes, the hp bar visual also changes
    // style the hp bar so that there are rectangles for each hitpoint

    descriptionPosition: string = "bottom";
    @Input() playerInfo: PlayerInfo = {
        name: 'Jar Jar Binks',
        portrait: '/assets/images/characters/Hephaestus.webp/',
        hp: 6,
        currentHp: 4,
        speed: 4,
        movementPointsLeft: 3,
        attack: 4,
        atkDice: 6,
        defense: 4,
        defDice: 4,
        inventory: [
            {
                id: ObjectType.Trident,
                name: 'Trident',
                description: 'Trident de Poséidon',
                count: 1,
                image: '/assets/images/objects/poseidon-trident.jpg/',
            },
            {
                id: ObjectType.Sandal,
                name: 'Sandales ailées',
                description: 'Sandales augmentant la stat de rapidité',
                count: 1,
                image: '/assets/images/objects/winged-sandals.jpg/',
            },
        ],
    };
    movementPointsArray = Array(this.playerInfo.movementPointsLeft);
}
