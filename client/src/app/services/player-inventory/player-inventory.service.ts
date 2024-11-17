import { Injectable } from '@angular/core';
import { ObjectType } from '@app/constants';
import { gameObjects } from '@app/objects-info';
import { GameObject } from '@common/game-object';
import { Player } from '@common/player';
import { SocketCommunicationService } from '../sockets/socket-communication/socket-communication.service';

@Injectable({
    providedIn: 'root',
})
export class PlayerInventoryService {
    itemToPlace : number;
    randomItemId: number;
    constructor(private socketCommunicationService: SocketCommunicationService) {}

    determineRandomItem(allObjects: number[][]): number {
        let realItem;
        let itemsNotAvailable: number[] = [];
        let itemsAvailable: number[] = [];
        for (let i = 0; i < allObjects.length; i++) {
            for (let j = 0; j < allObjects[i].length; j++) {
                if (allObjects[i][j] !== 0) {
                    itemsNotAvailable.push(allObjects[i][j]);
                }
            }
        }

        for (let o = 0; o < gameObjects.length; o++) {
            if (!itemsNotAvailable.find((object) => object === gameObjects[o].id)) {
                if (gameObjects[o].id < ObjectType.Random) {
                    itemsAvailable.push(gameObjects[o].id);
                }
            }
        }
        const itemToUse = Math.floor(Math.random() * itemsAvailable.length) + 1;
        realItem = itemsAvailable[itemToUse - 1];
        return realItem;
    }

    // Only the items that change stats directly are here
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
        }
        switch (fullItem?.id) {
            // will probably in navigation
            // case ObjectType.Trident:
            //     return player;

            // In the combat logic service for the rest
            case ObjectType.Armor:
                player.attributes.attack += 2;
                break;
            case ObjectType.Sandal:
                player.attributes.speed *= 2;
                player.attributes.totalHp -= 2;
                player.attributes.currentHp -= 2;
                break;
            case ObjectType.Lightning:
                player.attributes.attack *= 2;
                player.attributes.defense -= 2;
                player.attributes.totalHp -= 2;
                player.attributes.currentHp -= 2;
                break;

            // In combat logic
            // case ObjectType.Xiphos:
            //     return player;

            // In navigation
            // case ObjectType.Kunee:
            //     return player;
            default:
                break;
        }
        this.socketCommunicationService.send('inventoryChange', player);
    }

    getItemToPlace()
    {
        return this.itemToPlace;
    }
    
    // doesn't add the correct item at times
    updatePlayerAfterSwap(playerToModify: Player, newItem: number, itemDropped: GameObject) {
        this.itemToPlace = itemDropped.id;
        switch (itemDropped.id) {
            case ObjectType.Armor:
                playerToModify.attributes.attack -= 2;
                break;
            case ObjectType.Sandal:
                playerToModify.attributes.speed /= 2;
                playerToModify.attributes.totalHp += 2;
                playerToModify.attributes.currentHp += 2;
                break;
            case ObjectType.Lightning:
                playerToModify.attributes.attack /= 2;
                playerToModify.attributes.defense += 2;
                playerToModify.attributes.totalHp += 2;
                playerToModify.attributes.currentHp += 2;
                break;
            default:
                break;
        }

        switch (newItem) {
            case ObjectType.Armor:
                playerToModify.attributes.attack += 2;
                break;
            case ObjectType.Sandal:
                playerToModify.attributes.speed *= 2;
                playerToModify.attributes.totalHp -= 2;
                playerToModify.attributes.currentHp -= 2;
                break;
            case ObjectType.Lightning:
                playerToModify.attributes.attack *= 2;
                playerToModify.attributes.defense -= 2;
                playerToModify.attributes.totalHp -= 2;
                playerToModify.attributes.currentHp -= 2;
                break;
            default:
                break;
        }
        this.socketCommunicationService.send('inventoryChange', playerToModify);
    }
}
