import { ObjectType } from '@common/avatars-info';
import { Behavior, Player, Position } from '@common/player';
import { Room } from '@common/room';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class BotService {
    constructor() {}

    processBotTurn(room: Room, server: Server, activePlayer: Player) {
        if (activePlayer.behavior === Behavior.Aggressive) {
            // console.log('aggressive bot');
            this.processAggressiveBot(room, server, activePlayer);
        } else {
            this.processDefensiveBot(room, server, activePlayer);
        }
    }

    async processDefensiveBot(room: Room, server: Server, activePlayer: Player) {
        //Magic number
        //TODO : remmetre le delai
        //await this.delay(this.getRandomInt(3000, 25000));
        const players = room.listPlayers;
        const reachability = room.navigation.findReachableTiles(activePlayer, room);
        if (this.checkForDefenseItems(room, reachability)) {
            const path = room.navigation.findFastestPath(activePlayer, this.checkForDefenseItems(room, reachability), room);
            server.to(room.roomId).emit('botNavigation', path);
        }

        const target = room.navigation.findClosestPlayer(activePlayer, players, room);
        if (target) {
            //Check if the bot can attack the target
            const path = this.checkForEnemy(room, activePlayer, target);
            if (path.length > 0) {
                path.pop();
                server.to(room.roomId).emit('botNavigation', path);
                //Magic number
                //TODO : remmetre le delai
                //await this.delay(1000); // to replace par 3000
                this.attackPlayer(room, server, target, activePlayer);
                //await server.to(room.roomId).emit('endTurnBot', path);
                return;
            }
        }

        // Move to a random tile methode
        if (reachability.length > 0) {
            const randomIndex = Math.floor(Math.random() * reachability.length);
            const randomTile = reachability[randomIndex];
            const path = room.navigation.findFastestPath(activePlayer, randomTile, room);
            server.to(room.roomId).emit('botNavigation', path);
        }
    }

    async processAggressiveBot(room: Room, server: Server, activePlayer: Player) {
        //Magic number
        // console.log('process aggressive bot');
        //TODO : remmetre le delai
        //await this.delay(this.getRandomInt(3000, 25000));
        const players = room.listPlayers;
        const target = room.navigation.findClosestPlayer(activePlayer, players, room);
        const reachability = room.navigation.findReachableTiles(activePlayer, room);

        if (target) {
            // console.log('target', target);
            //Check if the bot can attack the target
            const path = this.checkForEnemy(room, activePlayer, target);
            if (path.length > 0) {
                path.pop();
                server.to(room.roomId).emit('botNavigation', path);
                //Magic number
                //TODO : remmetre le delai
                //await this.delay(3000);
                this.attackPlayer(room, server, target, activePlayer);
                //server.to(room.roomId).emit('endTurnBot', path);
                return;
            }
        }
        //check for attack items
        const item = this.checkForAttackItems(room, reachability);
        if (item) {
            const path = room.navigation.findFastestPath(activePlayer, item, room);
            server.to(room.roomId).emit('botNavigation', path);
            return;
        }

        // Move to a random tile methode
        //Pour eviter le probleme de 30 secondes, on peut toujours appeler ca a al fin pour pouvoir aller
        //au plus loin possible et terminer automatiquement le tour
        if (reachability.length > 0) {
            const randomIndex = Math.floor(Math.random() * reachability.length);
            const randomTile = reachability[randomIndex];
            const path = room.navigation.findFastestPath(activePlayer, randomTile, room);
            server.to(room.roomId).emit('botNavigation', path);
        }
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
            //TODO : replacer les valeurs par les valeurs des objets qui sont dans client
            //Lightning, Xiphos
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
            //Magic number
            if (items[tile.x][tile.y] === ObjectType.Kunee || items[tile.x][tile.y] === ObjectType.Trident) {
                return tile;
            }
        }
        return this.checkForAnyItems(room, reachability);
    }

    private checkForAnyItems(room: Room, reachability: Position[]) {
        for (const tile of reachability) {
            //TODO : magic number
            if (room.gameMap.itemPlacement[tile.x][tile.y] !== 0 && room.gameMap.itemPlacement[tile.x][tile.y] !== 8) {
                return tile;
            }
        }
    }

    private async delay(timeMs: number) {
        return new Promise((resolve) => setTimeout(resolve, timeMs));
    }

    private getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}
