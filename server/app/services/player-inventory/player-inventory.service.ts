import { MAX_OBJECT_EFFECT, MIN_OBJECT_EFFECT } from '@app/constants';
import { InfoSwap } from '@app/interfaces/info-item-swap';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { RoomService } from '@app/services/room/room.service';
import { ObjectType } from '@common/avatars-info';
import { GameObject } from '@common/interfaces/game-object';
import { Behavior, Player, Status } from '@common/interfaces/player';
import { Room } from '@common/interfaces/room';
import { gameObjects } from '@common/objects-info';
import { ServerToClientEvent } from '@common/socket.events';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PlayerInventoryService {
    constructor(
        private roomService: RoomService,
        private gameLogService: GameLogsService,
    ) {}

    updateInventory(info: InfoSwap, allItems: number[][]) {
        const room = this.roomService.getRoom(info.client);
        let itemPickedUp = allItems[info.player.position.x][info.player.position.y];
        if (itemPickedUp === ObjectType.Random) {
            itemPickedUp = this.determineRandomItem(allItems, room);
        }
        if (info.player.inventory.length === 2) {
            this.handleItemSwap(room, info, itemPickedUp);
            return;
        } else {
            info.player = this.updatePlayerWithItem(info.player, itemPickedUp);
            this.gameLogService.sendItemLog(info.player, room.roomId, info.server, itemPickedUp);
            room.gameMap.itemPlacement[info.player.position.x][info.player.position.y] = 0;
        }
        const index = room.listPlayers.findIndex((players) => players.name === info.player.name);
        room.listPlayers[index].attributes = info.player.attributes;
        room.listPlayers[index].inventory = info.player.inventory;
        info.client.emit(ServerToClientEvent.UpdatedInventory, info.player);
    }

    determineRandomItem(allObjects: number[][], room: Room): number {
        const itemsNotAvailable: number[] = [];
        const itemsAvailable: number[] = [];

        for (const players of room.listPlayers) {
            if (players.inventory.length > 0) {
                for (const items of players.inventory) {
                    itemsNotAvailable.push(items.id);
                }
            }
        }

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

    addStatsFromItem(playerToBuff: Player, itemId: number) {
        switch (itemId) {
            case ObjectType.Armor:
                playerToBuff.attributes.attack += 2;
                break;
            case ObjectType.Sandal:
                playerToBuff.attributes.speed *= 2;
                playerToBuff.attributes.currentHp -= 1;
                playerToBuff.attributes.totalHp -= 1;
                break;
            case ObjectType.Lightning:
                playerToBuff.attributes.attack *= 2;
                playerToBuff.attributes.defense -= 2;
                playerToBuff.attributes.totalHp -= 1;
                playerToBuff.attributes.currentHp -= 1;
                break;
            default:
                break;
        }
        return playerToBuff;
    }

    removeItemEffects(player: Player, itemToUndo: number) {
        switch (itemToUndo) {
            case ObjectType.Armor:
                player.attributes.attack -= MAX_OBJECT_EFFECT;
                break;
            case ObjectType.Sandal:
                player.attributes.speed /= MAX_OBJECT_EFFECT;
                player.attributes.totalHp += MIN_OBJECT_EFFECT;
                player.attributes.currentHp += MIN_OBJECT_EFFECT;
                break;
            case ObjectType.Lightning:
                player.attributes.attack /= MAX_OBJECT_EFFECT;
                player.attributes.defense += MAX_OBJECT_EFFECT;
                player.attributes.totalHp += MIN_OBJECT_EFFECT;
                player.attributes.currentHp += MIN_OBJECT_EFFECT;
                break;
            case ObjectType.Trident:
                player.attributes.actionPoints -= MIN_OBJECT_EFFECT;
                player.attributes.maxActionPoints = MIN_OBJECT_EFFECT;
                break;
            default:
                break;
        }
        return player;
    }

    updatePlayerWithItem(player: Player, item: number) {
        const fullItem = gameObjects.find((object) => object.id === item);
        if (fullItem) {
            player.inventory.push(fullItem);
            player = this.addStatsFromItem(player, fullItem?.id);
            this.addUniqueItemToHistory(player, fullItem?.id);
        }
        return player;
    }

    addUniqueItemToHistory(player: Player, newItemId: number) {
        if (!player.collectedItems.some((item) => item === newItemId)) {
            player.collectedItems.push(newItemId);
        }
    }

    updatePlayerAfterSwap(infoSwap: InfoSwap) {
        let newItem = 0;
        for (const items of infoSwap.modifiedInventory) {
            if (!infoSwap.oldInventory.find((oldItems) => oldItems.id === items.id)) {
                newItem = items.id;
                break;
            }
        }
        let playerToUpdate = infoSwap.player;
        const room = this.roomService.getRoom(infoSwap.client);
        if (!playerToUpdate) {
            playerToUpdate = room.listPlayers.find((players) => players.id === infoSwap.client.id);
        }
        playerToUpdate = this.removeItemEffects(playerToUpdate, infoSwap.oldInventory[0].id);
        playerToUpdate = this.removeItemEffects(playerToUpdate, infoSwap.oldInventory[1].id);

        playerToUpdate.inventory = infoSwap.modifiedInventory;
        playerToUpdate = this.addStatsFromItem(playerToUpdate, infoSwap.modifiedInventory[0].id);
        playerToUpdate = this.addStatsFromItem(playerToUpdate, infoSwap.modifiedInventory[1].id);

        if (newItem > 0) {
            this.gameLogService.sendItemLog(playerToUpdate, room.roomId, infoSwap.server, newItem);
        }
        room.gameMap.itemPlacement[playerToUpdate.position.x][playerToUpdate.position.y] = infoSwap.droppedItem;

        const index = room.listPlayers.findIndex((players) => players.name === playerToUpdate.name);
        room.listPlayers[index].attributes = playerToUpdate.attributes;
        room.listPlayers[index].inventory = playerToUpdate.inventory;

        this.addUniqueItemToHistory(playerToUpdate, newItem);

        infoSwap.server.to(room.roomId).emit(ServerToClientEvent.UpdateObjects, room.gameMap.itemPlacement);
        infoSwap.client.to(room.roomId).emit(ServerToClientEvent.UpdatedInventory, playerToUpdate);
        return playerToUpdate;
    }

    private getPrioritizedItem(info: InfoSwap, itemPickedUp: number): InfoSwap {
        let itemToDrop = this.determineItemToDrop(info.player.inventory, itemPickedUp, info.player);
        info.modifiedInventory = info.player.inventory.filter((item) => item.id !== itemToDrop.id);
        if (itemToDrop.id !== itemPickedUp) {
            info.modifiedInventory.push(gameObjects.find((object) => object.id === itemPickedUp));
        }
        info.droppedItem = itemToDrop.id;
        return info;
    }

    private determineItemToDrop(inventory: GameObject[], itemPickedUp: number, player: Player): GameObject {
        const itemPickedUpObject = gameObjects.find((object) => object.id === itemPickedUp);
        if (itemPickedUpObject && this.isDefenseItem(itemPickedUpObject) && player.behavior === Behavior.Defensive) {
            return this.determineItemToDropDefensive(inventory, itemPickedUpObject);
        } else if (itemPickedUpObject && this.isAttackItem(itemPickedUpObject) && player.behavior === Behavior.Aggressive) {
            return this.determineItemToDropAggressive(inventory, itemPickedUpObject);
        }
        return itemPickedUpObject;
    }

    private handleItemSwap(room: Room, info: InfoSwap, itemPickedUp: number) {
        if (info.player.status === Status.Bot) {
            info.oldInventory = info.player.inventory;
            info = this.getPrioritizedItem(info, itemPickedUp);
            info.player = this.updatePlayerAfterSwap(info);

            return;
        } else {
            this.roomService.getTurnTimer(room.roomId).pauseTimer();
            info.client.emit(ServerToClientEvent.OpenItemSwitchModal, { activePlayer: info.player, itemPickedUp });
            return;
        }
    }

    private determineItemToDropDefensive(inventory: GameObject[], itemPickedUpObject: GameObject) {
        if (this.isDefenseItem(inventory[0])) {
            return inventory[0];
        } else if (this.isDefenseItem(inventory[1])) {
            return inventory[1];
        } else {
            return itemPickedUpObject;
        }
    }

    private isDefenseItem(item: GameObject) {
        return item.id === ObjectType.Trident || item.id === ObjectType.Kunee;
    }

    private determineItemToDropAggressive(inventory: GameObject[], itemPickedUpObject: GameObject) {
        if (!this.isAttackItem(inventory[0])) {
            return inventory[0];
        } else if (!this.isAttackItem(inventory[1])) {
            return inventory[1];
        } else {
            return itemPickedUpObject;
        }
    }
    private isAttackItem(item: GameObject) {
        return item.id === ObjectType.Lightning || item.id === ObjectType.Xiphos || item.id === ObjectType.Sandal || item.id === ObjectType.Armor;
    }
}
