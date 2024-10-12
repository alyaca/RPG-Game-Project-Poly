import { Component, ElementRef, Input, ViewChild } from '@angular/core';
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
    @ViewChild('hpBar') healthBar: ElementRef<HTMLProgressElement>;
    // check if when the hp changes, the hp bar visual also changes

    // Those functions are just for testing purposes to make sure that the page is reactive but,
    // we can use them to display the change in hp and all the other stuff when we do the game's logic.
    increaseMovement() {
        if (this.playerInfo.movementPointsLeft === this.playerInfo.speed) {
            return;
        }
        this.playerInfo.movementPointsLeft += 1;
        this.movementPointsArray = Array(this.playerInfo.movementPointsLeft);
    }

    decreaseMovement() {
        if (this.playerInfo.movementPointsLeft === 0) {
            return;
        }
        this.playerInfo.movementPointsLeft -= 1;
        this.movementPointsArray = Array(this.playerInfo.movementPointsLeft);
    }

    increaseActionPoints() {
        if (this.playerInfo.actionPoints === this.playerInfo.maxActionPoints) {
            return;
        }
        this.playerInfo.actionPoints += 1;
        this.actionPointsArray = Array(this.playerInfo.actionPoints);
    }

    decreaseActionPoints() {
        if (this.playerInfo.actionPoints === 0) {
            return;
        }
        this.playerInfo.actionPoints -= 1;
        this.actionPointsArray = Array(this.playerInfo.actionPoints);
    }

    increaseHP() {
        if (this.playerInfo.currentHp === this.playerInfo.hp) {
            return;
        }
        this.playerInfo.currentHp += 1;
        this.healthBar.nativeElement.value += 1;
    }
    decreaseHP() {
        if (this.playerInfo.currentHp === 0) {
            return;
        }
        this.playerInfo.currentHp -= 1;
        this.healthBar.nativeElement.value -= 1;
    }

    descriptionPosition: string = 'bottom';
    @Input() playerInfo: PlayerInfo = {
        name: 'Jar Jar Binks',
        portrait: '/assets/images/characters/Hephaestus.webp/',
        hp: 6,
        currentHp: 4,
        speed: 4,
        maxActionPoints: 2,
        actionPoints: 1,
        movementPointsLeft: 3,
        evasionsLeft: 2,
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
    actionPointsArray = Array(this.playerInfo.actionPoints);
    movementPointsArray = Array(this.playerInfo.movementPointsLeft);
}
