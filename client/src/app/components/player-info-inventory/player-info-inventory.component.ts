import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { GameObjectComponent } from '@app/components/map-editor/game-object/game-object.component';
import { PLAYERS } from '@app/constants';
import { PlayerObjects } from '@app/interfaces/playerObject';

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
        if (this.playerInfo.statsAndInventory.movementPointsLeft === this.playerInfo.statsAndInventory.speed) {
            return;
        }
        this.playerInfo.statsAndInventory.movementPointsLeft += 1;
        this.movementPointsArray = Array(this.playerInfo.statsAndInventory.movementPointsLeft);
    }

    decreaseMovement() {
        if (this.playerInfo.statsAndInventory.movementPointsLeft === 0) {
            return;
        }
        this.playerInfo.statsAndInventory.movementPointsLeft -= 1;
        this.movementPointsArray = Array(this.playerInfo.statsAndInventory.movementPointsLeft);
    }

    increaseActionPoints() {
        if (this.playerInfo.statsAndInventory.actionPoints === this.playerInfo.statsAndInventory.maxActionPoints) {
            return;
        }
        this.playerInfo.statsAndInventory.actionPoints += 1;
        this.actionPointsArray = Array(this.playerInfo.statsAndInventory.actionPoints);
    }

    decreaseActionPoints() {
        if (this.playerInfo.statsAndInventory.actionPoints === 0) {
            return;
        }
        this.playerInfo.statsAndInventory.actionPoints -= 1;
        this.actionPointsArray = Array(this.playerInfo.statsAndInventory.actionPoints);
    }

    increaseHP() {
        if (this.playerInfo.statsAndInventory.currentHp === this.playerInfo.statsAndInventory.hp) {
            return;
        }
        this.playerInfo.statsAndInventory.currentHp += 1;
        this.healthBar.nativeElement.value += 1;
    }
    decreaseHP() {
        if (this.playerInfo.statsAndInventory.currentHp === 0) {
            return;
        }
        this.playerInfo.statsAndInventory.currentHp -= 1;
        this.healthBar.nativeElement.value -= 1;
    }

    descriptionPosition: string = 'bottom';

    // VERY TEMPORARY, JUST FOR THE STATIC VIEW OF THE PAGE
    @Input() playerInfo: PlayerObjects = PLAYERS[0];
    actionPointsArray = Array(this.playerInfo.statsAndInventory.actionPoints);
    movementPointsArray = Array(this.playerInfo.statsAndInventory.movementPointsLeft);
}
