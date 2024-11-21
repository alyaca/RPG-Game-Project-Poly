import { ObjectType } from '@common/avatars-info';
import { gameObjects } from '@common/objects-info';
import { Player } from '@common/player';
import { Room } from '@common/room';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';

@Injectable()
export class PlayerInventoryService{
    room : Room;
    constructor(private roomService : RoomService){}

    updateInventory(server : Server, client : Socket, allItems : number[][], activePlayer : Player, itemPickedUp : number)
    {
        this.room = this.roomService.getRoom(client);
        if(itemPickedUp === ObjectType.Random)
        {
            itemPickedUp = this.determineRandomItem(allItems);
        }
        if(activePlayer.inventory.length === 2)
        {
            client.emit('openItemSwitchModal', { activePlayer, itemPickedUp });
            server.emit('updateTile', itemPickedUp);
        }
        else
        {
            activePlayer = this.updatePlayerWithItem(activePlayer, itemPickedUp);
            server.emit('updateTile', 0);
            this.room.gameMap.itemPlacement[activePlayer.position.x][activePlayer.position.y] = 0;
            this.roomService.updateRoomMap(this.room);
        }
        client.emit('updateInventory', activePlayer);
        this.roomService.updateRoomPlayers(client, activePlayer);
    }

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

    updatePlayerWithItem(player: Player, item: number) {
        const fullItem = gameObjects.find((object) => object.id === item);
        if (fullItem) {
            player.inventory.push(fullItem);
            player = this.addStatsFromItem(player, fullItem?.id);
        }
        return player;
    }

    updatePlayerAfterSwap(playerToModify: Player, newItem: number, itemDropped: number) {
        playerToModify = this.removeItemsEffects(playerToModify, itemDropped, undefined);
        playerToModify = this.addStatsFromItem(playerToModify, newItem);
        this.room.gameMap[playerToModify.position.x][playerToModify.position.y] = itemDropped;
        this.roomService.updateRoomMap(this.room);
        return playerToModify;
    }
}