import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { GameObjectComponent } from '@app/components/map-editor/game-object/game-object.component';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';
import { Room } from '@common/room';

@Component({
    selector: 'app-player-info-inventory',
    standalone: true,
    imports: [GameObjectComponent, GameObjectComponent],
    templateUrl: './player-info-inventory.component.html',
    styleUrl: './player-info-inventory.component.scss',
})
export class PlayerInfoInventoryComponent implements OnInit {
    @Input() playerId: string | undefined;
    @ViewChild('hpBar') healthBar: ElementRef<HTMLProgressElement>;
    player: Player;
    actionPointsArray: number[];
    movementPointsArray: number[];
    descriptionPosition: string = 'bottom';
    constructor(private socketCommunicationService: SocketCommunicationService) {}

    get emptySlots(): number[] {
        const emptySlotsCount = 2 - (this.player?.inventory?.length || 0);
        return Array.from({ length: emptySlotsCount }, () => 0);
    }

    ngOnInit() {
        this.socketCommunicationService.on<Room>('mapInformation', (room: Room) => {
            const foundPlayer = room.listPlayers.find((player) => player.id === this.playerId);
            if (foundPlayer) {
                this.player = foundPlayer;
                this.actionPointsArray = Array(1);
                this.movementPointsArray = Array(this.player.attributes.speed);
            }
        });

        this.socketCommunicationService.on<Player>('updateInventory', (playerToUpdate: Player) => {
            if(this.player.name === playerToUpdate.name)
            {
                this.player.attributes = playerToUpdate.attributes;
                this.player.inventory = playerToUpdate.inventory;
                this.player.attributes.currentHp = playerToUpdate.attributes.totalHp;
            }
        });
    }

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
