import { Injectable } from '@angular/core';
import { ObjectType } from '@app/constants';
import { gameObjects } from '@app/objects-info';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { GameObject } from '@common/game-object';
import { Player } from '@common/player';

@Injectable({
    providedIn: 'root',
})
export class PlayerInventoryService {
    itemToPlace: number;
    randomItemId: number;
    constructor(private socketCommunicationService: SocketCommunicationService) {}

    determineRandomItem(allObjects: number[][]): number {
        const itemsNotAvailable: number[] = [];
        const itemsAvailable: number[] = [];

        for (const objectRows of allObjects) {
            for (const objects of objectRows) {
                if (objects !== 0) {
                    itemsNotAvailable.push(objects);
                }
            }
        }

        for (const objects of gameObjects) {
            if (!itemsNotAvailable.find((object) => object === objects.id)) {
                if (objects.id < ObjectType.Random) {
                    itemsAvailable.push(objects.id);
                }
            }
        }

        const itemToUse = Math.floor(Math.random() * itemsAvailable.length) + 1;
        const realItem = itemsAvailable[itemToUse - 1];
        return realItem;
    }

    // might be useless, idk yet
    getItemToPlace() {
        return this.itemToPlace;
    }

    addStatsFromItem(playerToBuff: Player, itemId: number) {
        switch (itemId) {
            case ObjectType.Armor:
                playerToBuff.attributes.attack += 2;
                break;
            case ObjectType.Sandal:
                playerToBuff.attributes.speed *= 2;
                playerToBuff.attributes.currentHp -= 2;
                playerToBuff.attributes.totalHp -= 2;
                break;
            case ObjectType.Lightning:
                playerToBuff.attributes.attack *= 2;
                playerToBuff.attributes.defense -= 2;
                playerToBuff.attributes.currentHp -= 2;
                playerToBuff.attributes.totalHp -= 2;
                break;
            default:
                break;
        }
        return playerToBuff;
    }

    removeItemsEffects(player: Player, item1: number | undefined, item2: number | undefined) {
        const inventory = [item1, item2];
        for (const items of inventory) {
            if (items) {
                switch (items) {
                    case ObjectType.Armor:
                        player.attributes.attack -= 2;
                        break;
                    case ObjectType.Sandal:
                        player.attributes.speed /= 2;
                        player.attributes.totalHp += 2;
                        player.attributes.currentHp += 2;
                        break;
                    case ObjectType.Lightning:
                        player.attributes.attack /= 2;
                        player.attributes.defense += 2;
                        player.attributes.totalHp += 2;
                        player.attributes.currentHp += 2;
                        break;
                    case ObjectType.Trident:
                        player.attributes.actionPoints = 1;
                        player.attributes.maxActionPoints = 1;
                        break;
                    default:
                        break;
                }
            }
        }
        if (item1 && item2) {
            player.inventory = [];
        }
        return player;
    }

    updatePlayerWithItem(player: Player, item: number, allObjects: number[][]) {
        let itemToUse: number;
        if (item === ObjectType.Random) {
            itemToUse = this.determineRandomItem(allObjects);
        } else {
            itemToUse = item;
        }
        const fullItem = gameObjects.find((object) => object.id === itemToUse);
        if (fullItem) {
            player.inventory.push(fullItem);
            player = this.addStatsFromItem(player, fullItem?.id);
        }

        this.socketCommunicationService.send('inventoryChange', player);
    }

    // doesn't add the correct item at times
    updatePlayerAfterSwap(playerToModify: Player, newItem: number, itemDropped: GameObject) {
        this.itemToPlace = itemDropped.id;
        playerToModify = this.removeItemsEffects(playerToModify, itemDropped.id, undefined);
        playerToModify = this.addStatsFromItem(playerToModify, newItem);
        this.socketCommunicationService.send('inventoryChange', playerToModify);
    }
}
