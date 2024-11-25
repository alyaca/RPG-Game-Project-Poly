import { InfoSwap } from '@app/interfaces/info-item-swap';
import { ObjectType } from '@common/avatars-info';
import { gameObjects } from '@common/objects-info';
import { Player } from '@common/player';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameLogsService } from '../game-logs/game-logs.service';
import { RoomService } from '../room/room.service';

@Injectable()
export class PlayerInventoryService {
    constructor(
        private roomService: RoomService,
        private gameLogService: GameLogsService,
    ) {}

    updateInventory(server: Server, client: Socket, allItems: number[][], activePlayer: Player, itemPickedUp: number) {
        const room = this.roomService.getRoom(client);
        if (itemPickedUp === ObjectType.Random) {
            itemPickedUp = this.determineRandomItem(allItems);
        }
        if (activePlayer.inventory.length === 2) {
            // timer pauses at the start of item switch
            this.roomService.getTurnTimer(room.roomId).pauseTimer();
            client.emit('openItemSwitchModal', { activePlayer, itemPickedUp });
            return;
        } else {
            this.gameLogService.sendItemLog(activePlayer, room.roomId, server, itemPickedUp);
            activePlayer = this.updatePlayerWithItem(activePlayer, itemPickedUp);

            room.gameMap.itemPlacement[activePlayer.position.x][activePlayer.position.y] = 0;
            this.roomService.updateRoomMap(room);
        }
        //Si j<envoi un seul event, avec activePlayer et droppedItem, ça devrait suffire
        client.emit('updateInventory', activePlayer);
        server.to(room.roomId).emit('updateTile', { player: activePlayer, wasDropped: false, droppedItem: 0 });
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
        infoSwap.player = this.removeItemEffects(infoSwap.player, infoSwap.oldInventory[0].id);
        infoSwap.player = this.removeItemEffects(infoSwap.player, infoSwap.oldInventory[1].id);

        infoSwap.player = this.addStatsFromItem(infoSwap.player, infoSwap.modifiedInventory[0].id);
        infoSwap.player = this.addStatsFromItem(infoSwap.player, infoSwap.modifiedInventory[1].id);

        const room = this.roomService.getRoom(infoSwap.client);
        this.gameLogService.sendItemLog(infoSwap.player, room.roomId, infoSwap.server, infoSwap.modifiedInventory[0].id);
        this.gameLogService.sendItemLog(infoSwap.player, room.roomId, infoSwap.server, infoSwap.modifiedInventory[1].id);

        room.gameMap.itemPlacement[infoSwap.player.position.x][infoSwap.player.position.y] = infoSwap.droppedItem;
        this.roomService.updateRoomMap(room);

        // infoSwap.server.to(room.roomId).emit('updateObjects', room.gameMap.itemPlacement); // idk
        infoSwap.server.to(room.roomId).emit('updateTile', { player: infoSwap.player, wasDropped: true, droppedItem: infoSwap.droppedItem }); // should visually update the tile after swapping
        return infoSwap.player;
    }
}
