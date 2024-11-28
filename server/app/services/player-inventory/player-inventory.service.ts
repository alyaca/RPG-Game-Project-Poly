import { InfoSwap } from '@app/interfaces/info-item-swap';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { RoomService } from '@app/services/room/room.service';
import { ObjectType } from '@common/avatars-info';
import { gameObjects } from '@common/objects-info';
import { Player } from '@common/player';
import { Room } from '@common/room';
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
            this.roomService.getTurnTimer(room.roomId).pauseTimer();
            info.client.emit('openItemSwitchModal', { activePlayer: info.player, itemPickedUp });
            return;
        } else {
            info.player = this.updatePlayerWithItem(info.player, itemPickedUp);
            this.gameLogService.sendItemLog(info.player, room.roomId, info.server, itemPickedUp);
            room.gameMap.itemPlacement[info.player.position.x][info.player.position.y] = 0;
        }
        const index = room.listPlayers.findIndex((players) => players.name === info.player.name);
        room.listPlayers[index].attributes = info.player.attributes;
        room.listPlayers[index].inventory = info.player.inventory;
        info.client.emit('updateInventory', info.player);
        info.server.emit('updatePlayersList', info.player);
    }

    determineRandomItem(allObjects: number[][], room : Room): number {
        const itemsNotAvailable: number[] = [];
        const itemsAvailable: number[] = [];

        for(const players of room.listPlayers) {
            if(players.inventory.length > 0) {
                for(const items of players.inventory) {
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
                playerToBuff.attributes.currentHp -= 1;
                playerToBuff.attributes.totalHp -= 1;
                break;
            default:
                break;
        }
        return playerToBuff;
    }

    removeItemEffects(player: Player, itemToUndo: number) {
        switch (itemToUndo) {
            case ObjectType.Armor:
                player.attributes.attack -= 2;
                break;
            case ObjectType.Sandal:
                player.attributes.speed /= 2;
                player.attributes.totalHp += 1;
                player.attributes.currentHp += 1;
                break;
            case ObjectType.Lightning:
                player.attributes.attack /= 2;
                player.attributes.defense += 2;
                player.attributes.totalHp += 1;
                player.attributes.currentHp += 1;
                break;
            case ObjectType.Trident:
                player.attributes.actionPoints -= 1;
                player.attributes.maxActionPoints = 1;
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
        }
        return player;
    }

    updatePlayerAfterSwap(infoSwap: InfoSwap) {
        let newItem = 0;
        for (const items of infoSwap.modifiedInventory)
        {
            if(!infoSwap.oldInventory.includes(items))
            {
                newItem = items.id;
                break;
            }
        }

        const room = this.roomService.getRoom(infoSwap.client);
        let playerToUpdate = room.listPlayers.find((players) => players.id === infoSwap.client.id);
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

        infoSwap.server.to(room.roomId).emit('updateObjects', room.gameMap.itemPlacement);
        infoSwap.client.to(room.roomId).emit('updateInventory', playerToUpdate);
        infoSwap.server.to(room.roomId).emit('updatePlayersList', playerToUpdate);
        return playerToUpdate;
    }
}
