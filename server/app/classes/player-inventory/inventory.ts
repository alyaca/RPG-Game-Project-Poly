import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { RoomService } from '@app/services/room/room.service';
import { ObjectType } from '@common/avatars-info';
import { gameObjects } from '@common/objects-info';
import { Player } from '@common/player';
import { Socket } from 'socket.io';

export class Inventory {
    constructor(
        private roomService: RoomService,
        private gameLogService: GameLogsService,
    ) {}

    initializeInventory() {}

    updateInventory(client: Socket, allItems: number[][], activePlayer: Player, itemPickedUp: number) {
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
            //this.gameLogService.sendItemLog(activePlayer, room.roomId, server, itemPickedUp);
            activePlayer = this.updatePlayerWithItem(activePlayer, itemPickedUp);
            room.gameMap.itemPlacement[activePlayer.position.x][activePlayer.position.y] = 0;
            this.roomService.updateRoomMap(room);
        }
        //utilise pour modifier le map
        this.roomService.updateRoomPlayers(client, activePlayer);
    }

    updatePlayerWithItem(player: Player, item: number) {
        const fullItem = gameObjects.find((object) => object.id === item);
        if (fullItem) {
            player.inventory.push(fullItem);
            player = this.addStatsFromItem(player, fullItem?.id);
        }
        return player;
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
}
