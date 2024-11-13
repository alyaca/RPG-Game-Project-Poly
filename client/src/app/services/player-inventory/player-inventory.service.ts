import { Injectable } from '@angular/core';
import { DialogTitle, MAX_INVENTORY_ITEMS, ObjectType } from '@app/constants';
import { gameObjects } from '@app/objects-info';
import { Player } from '@common/player';
import { GameService } from '../sockets/game/game.service';
import { SocketCommunicationService } from '../sockets/socket-communication/socket-communication.service';

@Injectable({
    providedIn: 'root',
})
export class PlayerInventoryService {
    constructor(
        private socketCommunicationService: SocketCommunicationService,
        private gameService: GameService,
    ) {}

    updateInventory(player: Player, item: number, objectsOnMap: number[][]): number {
        if (player.inventory.length === MAX_INVENTORY_ITEMS) {
            const itemToExchange = gameObjects.find((object) => object.id === item);
            let itemToDrop = itemToExchange;
            this.gameService
                .openDialog({
                    title: DialogTitle.ItemExchange,
                    messages: [`Quel objet voulez échangé pour celui-ci: ${itemToExchange?.name}`],
                    options: [player.inventory[0].name, player.inventory[1].name],
                    confirm: false,
                })
                .subscribe((objectToDrop) => {
                    if (itemToExchange) {
                        if (objectToDrop === player.inventory[0].name) {
                            itemToDrop = player.inventory[0];
                            player.inventory[0] = itemToExchange;
                        } else if (objectToDrop === player.inventory[1].name) {
                            itemToDrop = player.inventory[1];
                            player.inventory[1] = itemToExchange;
                        } else {
                            itemToDrop = itemToExchange;
                        }
                    }
                });
            if (itemToDrop) {
                return itemToDrop.id;
            }
            return item;
            // openDialog
            //if exchange item, return itemExchanged
            //else, return the item on the ground
        } else {
            const itemToAdd = gameObjects.find((object) => object.id === item);
            if (!itemToAdd) return 0;
            player = this.updatePlayerWithItem(player, item, objectsOnMap);
            // player.inventory.push(itemToAdd);
            this.socketCommunicationService.send('inventoryChange', player);
            return 0;
        }
    }

    // Only the items that change stats directly are here
    updatePlayerWithItem(player: Player, item: number, objectsUsed: number[][]) {
        let realItem;
        let itemsNotAvailable: number[] = [];
        let itemsAvailable: number[] = [];
        if (item === ObjectType.Random) {
            for (let i = 0; i < objectsUsed.length; i++) {
                for (let j = 0; j < objectsUsed[i].length; j++) {
                    if (objectsUsed[i][j] !== 0) {
                        itemsNotAvailable.push(objectsUsed[i][j]);
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
        } else {
            realItem = item;
        }
        const fullItem = gameObjects.find((object) => object.id === realItem);
        if (fullItem) {
            player.inventory.push(fullItem);
        }
        switch (realItem) {
            // will probably in navigation
            // case ObjectType.Trident:
            //     return player;

            // In the combat logic service for the rest
            case ObjectType.Armor:
                player.attributes.attack += 4;
                return player;
            case ObjectType.Sandal:
                player.attributes.speed *= 2;
                player.attributes.totalHp -= 2;
                player.attributes.currentHp -= 2;
                return player;
            case ObjectType.Lightning:
                player.attributes.attack *= 2;
                player.attributes.defense -= 2;
                player.attributes.totalHp -= 2;
                player.attributes.currentHp -= 2;
                return player;

            // In combat logic
            // case ObjectType.Xiphos:
            //     return player;

            // In navigation
            // case ObjectType.Kunee:
            //     return player;
            default:
                return player;
        }
    }
}
