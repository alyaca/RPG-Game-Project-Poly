import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { GameObjectComponent } from '@app/components/map-editor/game-object/game-object.component';
import { Player } from '@common/player';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';

@Component({
    selector: 'app-player-info-inventory',
    standalone: true,
    imports: [GameObjectComponent, GameObjectComponent],
    templateUrl: './player-info-inventory.component.html',
    styleUrl: './player-info-inventory.component.scss',
})
export class PlayerInfoInventoryComponent {
    // VERY TEMPORARY, JUST FOR THE STATIC VIEW OF THE PAGE
    @Input() player: Player = mockLobbyPlayers[2];
    @ViewChild('hpBar') healthBar: ElementRef<HTMLProgressElement>;
    actionPointsArray = Array(this.player.attributes.actionPoints);
    movementPointsArray = Array(this.player.attributes.movementPointsLeft);

    descriptionPosition: string = 'bottom';
    // check if when the hp changes, the hp bar visual also changes

    // Those functions are just for testing purposes to make sure that the page is reactive but,
    // we can use them to display the change in hp and all the other stuff when we do the game's logic.
    increaseMovement() {
        if (this.player.attributes.movementPointsLeft === this.player.attributes.speed) {
            return;
        }
        this.player.attributes.movementPointsLeft += 1;
        this.movementPointsArray = Array(this.player.attributes.movementPointsLeft);
    }

    decreaseMovement() {
        if (this.player.attributes.movementPointsLeft === 0) {
            return;
        }
        this.player.attributes.movementPointsLeft -= 1;
        this.movementPointsArray = Array(this.player.attributes.movementPointsLeft);
    }

    increaseActionPoints() {
        if (this.player.attributes.actionPoints === this.player.attributes.maxActionPoints) {
            return;
        }
        this.player.attributes.actionPoints += 1;
        this.actionPointsArray = Array(this.player.attributes.actionPoints);
    }

    decreaseActionPoints() {
        if (this.player.attributes.actionPoints === 0) {
            return;
        }
        this.player.attributes.actionPoints -= 1;
        this.actionPointsArray = Array(this.player.attributes.actionPoints);
    }

    increaseHP() {
        if (this.player.attributes.currentHp === this.player.attributes.totalHp) {
            return;
        }
        this.player.attributes.currentHp += 1;
        this.healthBar.nativeElement.value += 1;
    }
    decreaseHP() {
        if (this.player.attributes.currentHp === 0) {
            return;
        }
        this.player.attributes.currentHp -= 1;
        this.healthBar.nativeElement.value -= 1;
    }
}
