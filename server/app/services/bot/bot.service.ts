import { MILLISECONDS_IN_SECOND, NO_ATTACK_TIME, STARTING_TIME } from '@app/constants';
import { ObjectType } from '@common/avatars-info';
import { Behavior, Player, Position } from '@common/interfaces/player';
import { Room } from '@common/interfaces/room';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class BotService {
    processBotTurn(room: Room, server: Server, activePlayer: Player) {
        if (activePlayer.behavior === Behavior.Aggressive) {
            this.processAggressiveBot(room, server, activePlayer);
        } else {
            this.processDefensiveBot(room, server, activePlayer);
        }
    }

    async processDefensiveBot(room: Room, server: Server, activePlayer: Player) {
        await this.delay(this.getRandomInt(STARTING_TIME, NO_ATTACK_TIME));
        const players = room.listPlayers;
        const reachability = room.navigation.findReachableTiles(activePlayer, room);
        if (this.checkForDefenseItems(room, reachability)) {
            const path = room.navigation.findFastestPath(activePlayer, this.checkForDefenseItems(room, reachability), room);
            server.to(room.roomId).emit('botNavigation', path);
        }
        const target = room.navigation.findClosestPlayer(activePlayer, players, room);
        if (target) {
            const path = this.checkForEnemy(room, activePlayer, target);
            if (path.length > 0) {
                path.pop();
                server.to(room.roomId).emit('botNavigation', path);
                await this.delay(STARTING_TIME);
                this.attackPlayer(room, server, target, activePlayer);
                return;
            }
        }
        if (reachability.length > 0) {
            this.navigateToRandomTile(room, server, activePlayer, reachability);
        }
    }

    async processAggressiveBot(room: Room, server: Server, activePlayer: Player) {
        await this.delay(this.getRandomInt(STARTING_TIME, NO_ATTACK_TIME));
        const players = room.listPlayers;
        const target = room.navigation.findClosestPlayer(activePlayer, players, room);
        const reachability = room.navigation.findReachableTiles(activePlayer, room);

        if (target) {
            const path = this.checkForEnemy(room, activePlayer, target);
            if (path.length > 0) {
                path.pop();
                server.to(room.roomId).emit('botNavigation', path);
                await this.delay(STARTING_TIME * MILLISECONDS_IN_SECOND);
                this.attackPlayer(room, server, target, activePlayer);
                return;
            }
        }
        const item = this.checkForAttackItems(room, reachability);
        if (item) {
            const path = room.navigation.findFastestPath(activePlayer, item, room);
            server.to(room.roomId).emit('botNavigation', path);
            return;
        }

        if (reachability.length > 0) {
            this.navigateToRandomTile(room, server, activePlayer, reachability);
        }
    }

    private navigateToRandomTile(room: Room, server: Server, activePlayer: Player, reachability: Position[]) {
        const randomIndex = Math.floor(Math.random() * reachability.length);
        const randomTile = reachability[randomIndex];
        const path = room.navigation.findFastestPath(activePlayer, randomTile, room);
        server.to(room.roomId).emit('botNavigation', path);
    }

    private attackPlayer(room: Room, server: Server, target: Player, activePlayer: Player) {
        server.to(room.roomId).emit('botAttack', { position: target.position, player: activePlayer });
    }
    private checkForEnemy(room: Room, activePlayer: Player, target: Player) {
        const path = room.navigation.findFastestPath(activePlayer, target.position, room);
        return path;
    }
    private checkForAttackItems(room: Room, reachability: Position[]) {
        const items = room.gameMap.itemPlacement;
        for (const tile of reachability) {
            if (
                items[tile.x][tile.y] === ObjectType.Lightning ||
                items[tile.x][tile.y] === ObjectType.Xiphos ||
                items[tile.x][tile.y] === ObjectType.Sandal ||
                items[tile.x][tile.y] === ObjectType.Armor
            ) {
                return tile;
            }
        }
        return this.checkForAnyItems(room, reachability);
    }

    private checkForDefenseItems(room: Room, reachability: Position[]) {
        const items = room.gameMap.itemPlacement;
        for (const tile of reachability) {
            if (items[tile.x][tile.y] === ObjectType.Kunee || items[tile.x][tile.y] === ObjectType.Trident) {
                return tile;
            }
        }
        return this.checkForAnyItems(room, reachability);
    }

    private checkForAnyItems(room: Room, reachability: Position[]) {
        for (const tile of reachability) {
            if (room.gameMap.itemPlacement[tile.x][tile.y] !== 0 && room.gameMap.itemPlacement[tile.x][tile.y] !== ObjectType.Spawn) {
                return tile;
            }
        }
    }

    private async delay(timeMs: number) {
        return new Promise((resolve) => setTimeout(resolve, timeMs));
    }

    private getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min) * MILLISECONDS_IN_SECOND;
    }
}
