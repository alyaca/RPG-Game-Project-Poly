import { EVASION_SUCCESS_RATE, TileType, VICTORIES } from '@app/constants';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { CombatInfo } from '@common/combat-info';
import { Game } from '@common/game';
import { Player, Position } from '@common/player';
import { Room } from '@common/room';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
@Injectable()
export class CombatService {
    combatInfos = new Map<string, CombatInfo>();
    attacker: Player;
    defender: Player;

    private gameTime: number;
    constructor(
        private roomService: RoomService,
        private gameService: GameService,
    ) {}

    emitToCombatPlayers(server: Server, event: string, data?) {
        server.to(this.attacker.id).emit(event, data);
        server.to(this.defender.id).emit(event, data);
    }

    startFight(client: Socket, player1: Player, player2: Player, isPlayer1Active: boolean, server: Server) {
        const room = this.roomService.getRoom(client);
        this.attacker = player1;
        this.defender = player2;
        this.gameTime = this.roomService.getTurnTimer(room.roomId).getTimeRemaining();
        this.roomService.getTurnTimer(room.roomId).pauseTimer();
        this.emitToCombatPlayers(server, 'startFight', { player1, player2, isPlayer1Active });
        this.onStartTurn(client, server, room);
    }

    onStartTurn(client: Socket, server: Server, room: Room) {
        this.roomService.getFightTimer(room.roomId).resetTimer(5, (timeRemaining: number) => {
            this.emitToCombatPlayers(server, 'combatTime', timeRemaining);
            if (timeRemaining <= 0) {
                this.attackPlayer(client, server);
            }
        });
    }

    onEndTurn(client: Socket, server: Server, room: Room) {
        [this.attacker, this.defender] = [this.defender, this.attacker];
        this.emitToCombatPlayers(server, 'combatTurnEnded', { attacker: this.attacker, defender: this.defender });
        this.onStartTurn(client, server, room);
    }

    attackPlayer(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const attackValue = this.attacker.attributes.attack + this.getRandomValue(this.attacker.attributes.atkDiceMax);
        const defenseValue = this.defender.attributes.defense + this.getRandomValue(this.defender.attributes.defDiceMax);
        this.emitToCombatPlayers(server, 'attackValues', { attackValue, defenseValue });
        if (attackValue > defenseValue) {
            this.defender.attributes.currentHp--;
            this.emitToCombatPlayers(server, 'attackSuccess', this.attacker);
        } else {
            this.emitToCombatPlayers(server, 'attackFail', this.attacker);
        }
        const isPlayerDead = this.checkIfPlayerIsDead(client, this.defender, this.attacker, server);
        if (!isPlayerDead) {
            this.onEndTurn(client, server, room);
        }
    }

    evadingPlayer(client: Socket, player: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        if (this.isEvasionSuccessful()) {
            this.emitToCombatPlayers(server, 'evasionSuccess', player);
            this.continueTurn(client, server);
            this.emitToCombatPlayers(server, 'combatEnd', room.listPlayers);
        } else {
            this.emitToCombatPlayers(server, 'evasionFail', player);
            this.onEndTurn(client, server, room);
        }
    }

    isEvasionSuccessful() {
        return Math.random() < EVASION_SUCCESS_RATE;
    }

    isCombatFinish(client: Socket, defender: Player, attacker: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        this.addVictory(room, attacker, server);
        this.emitToCombatPlayers(server, 'playerDead', defender);
    }

    continueTurn(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        this.combatEnded(room);
        this.roomService.getTurnTimer(room.roomId).resumeTimer((timeRemaining) => {
            if (timeRemaining <= 0) {
                this.gameService.onTurnEnded(client, server);
            }
            server.to(room.roomId).emit('startedTurnTimer', timeRemaining);
        });
    }

    combatEnded(room: Room) {
        this.roomService.getFightTimer(room.roomId).stopTimer();
        room.listPlayers.forEach((player) => {
            player.attributes.currentHp = player.attributes.totalHp;
        });
    }

    checkIfPlayerIsDead(client: Socket, defender: Player, attacker: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        if (defender.attributes.currentHp <= 0) {
            this.movePlayerToSpwanPoint(defender, room.gameMap.itemPlacement);
            this.isCombatFinish(client, defender, attacker, server);
            this.continueTurn(client, server);
            return true;
        }
        return false;
    }

    checkEndGame(player: Player, room: Room, server: Server) {
        if (player.victories >= VICTORIES) {
            server.to(room.roomId).emit('endGame', player);
            this.gameService.stopGameTimers(room);
        }
    }

    getRandomValue(max: number) {
        return Math.floor(Math.random() * max + 1);
    }

    disconnectedPlayer(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const winner = this.getOpponent(client);
        this.defaultCombatWin(room, winner, server);
        if (winner.isActive) {
            const winnerSocket = server.sockets.sockets.get(winner.id);
            this.continueTurn(winnerSocket, server);
        }
        this.combatEnded(room);
    }

    isInCombat(client: Socket) {
        if (client) return client.id === this.attacker.id || client.id === this.defender.id;
    }

    addVictory(room: Room, player: Player, server: Server) {
        const playerWinner = room.listPlayers.find((p) => p.id === player.id);
        playerWinner.victories++;
        this.checkEndGame(playerWinner, room, server);
        server.to(room.roomId).emit('combatEnd', room.listPlayers);
    }

    movePlayerToSpwanPoint(player: Player, gameObjects: number[][]) {
        if (this.isPlayerAtSpawnPoint(player, gameObjects)) return;
        const { x, y } = player.spawnPosition;
        if (!this.isTileOccupiedByPlayerOrObject({ x, y }, gameObjects)) {
            // remove from the previous place, change posiiton of player (find it in room first)
            gameObjects[x][y] = player.avatar?.id;
        }
        // TODO: else on neighbor tile !
    }

    getNeighbors(position: Position, game: Game): Position[] {
        const directions = [
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
        ];
        return directions
            .map(({ dx, dy }) => ({ x: position.x + dx, y: position.y + dy }))
            .filter(({ x, y }) => this.isValidTile(x, y, game.dimension));
    }

    isTileOccupiedByPlayerOrObject(position: Position, gameObjects: number[][]) {
        return gameObjects[position.x][position.y] > 0;
    }
    isPlayerAtSpawnPoint(player: Player, gameObjects: number[][]) {
        const { x, y } = player.spawnPosition;
        return gameObjects[x][y] === player.avatar?.id;
    }

    private isValidTile(x: number, y: number, dimension: number): boolean {
        return x >= 0 && y >= 0 && x < dimension && y < dimension;
    }

    private isTerrainTile(tile: TileType) {
        return tile === TileType.Ground || tile === TileType.Ice || tile === TileType.Water;
    }

    private defaultCombatWin(room: Room, player: Player, server: Server) {
        this.addVictory(room, player, server);
        server.to(player.id).emit('defaultWin');
    }

    private getOpponent(client: Socket): Player {
        return client.id === this.attacker.id ? this.defender : this.attacker;
    }
}
