import { EVASION_SUCCESS_RATE, FIGHT_TIME, NO_EVASION_TIME, SPAWN_POINT_ID, VICTORIES } from '@app/constants';
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
        const turnTime = this.attacker.attributes.evasion === 0 ? NO_EVASION_TIME : FIGHT_TIME;
        this.roomService.getFightTimer(room.roomId).resetTimer(turnTime, (timeRemaining: number) => {
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
        const { attackValue, defenseValue } = this.getCombatValues();
        this.emitToCombatPlayers(server, 'attackValues', { attackValue, defenseValue });
        if (attackValue.total > defenseValue.total) {
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

    getCombatValues() {
        const attackDiceValue = this.getRandomValue(this.attacker.attributes.atkDiceMax);
        const attackValue = {
            total: this.attacker.attributes.attack + attackDiceValue,
            diceValue: attackDiceValue,
        };
        const defenseDiceValue = this.getRandomValue(this.defender.attributes.defDiceMax);
        const defenseValue = {
            total: this.defender.attributes.defense + defenseDiceValue,
            diceValue: defenseDiceValue,
        };
        return { attackValue, defenseValue };
    }

    evadingPlayer(client: Socket, player: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        this.attacker.attributes.evasion--;
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

    combatFinish(client: Socket, player1: Player, player2: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        this.addVictory(room, player2, server);
        client.to(room.roomId).emit('playerDead', player1);
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
        const activePlayer = this.gameService.getActivePlayer(room);
        if (defender.attributes.currentHp <= 0) {
            this.replacePlayerOnSpawnPoint(defender, client, server);
            this.combatFinish(client, defender, attacker, server);
            if (activePlayer.id !== defender.id) {
                this.continueTurn(client, server);
                const reachability = room.navigation.findReachableTiles(attacker, room.gameMap);
                server.to(room.roomId).emit('reachableTiles', reachability);
            } else {
                this.combatEnded(room);
                this.gameService.onTurnEnded(client, server);
            }
            return true;
        }
        // else if (attacker.attributes.currentHp <= 0) {
        //     this.replacePlayerOnSpawnPoint(attacker, client, server);
        //     this.combatFinish(client, attacker, defender, server);
        //     this.continueTurn(client, server);
        //     return true;
        // const reachability = room.navigation.findReachableTiles(attacker, room.gameMap);
        // server.to(room.roomId).emit('reachableTiles', reachability);
        // }
        return false;
    }

    checkEndGame(player: Player, room: Room, server: Server) {
        if (player.postGameStats.victories >= VICTORIES) {
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
        return client.id === this.attacker?.id || client.id === this.defender?.id;
    }

    addVictory(room: Room, player: Player, server: Server) {
        const playerWinner = room.listPlayers.find((p) => p.id === player.id);
        playerWinner.postGameStats.victories++;
        this.checkEndGame(playerWinner, room, server);
        server.to(room.roomId).emit('combatEnd', room.listPlayers);
    }

    replacePlayerOnSpawnPoint(player: Player, socket: Socket, server: Server): void {
        const room = this.roomService.getRoom(socket);
        const playerToReplace = room.listPlayers.find((p) => p.id === player.id);
        if (!playerToReplace) return;
        room.gameMap.itemPlacement[playerToReplace.position.x][playerToReplace.position.y] = 0;
        if (this.checkSpawnPointAvailability(playerToReplace, room.gameMap.itemPlacement)) {
            const oldPosition = playerToReplace.position;
            playerToReplace.position = playerToReplace.spawnPosition;
            server.to(room.roomId).emit('respawnPlayer', { oldPosition, playerToReplace });
        } else {
            const oldPosition = playerToReplace.position;
            server.to(room.roomId).emit('respawnPlayer', { oldPosition, playerToReplace });
        }
    }

    checkSpawnPointAvailability(player: Player, gameObjects: number[][]): boolean {
        return gameObjects[player.spawnPosition.x][player.spawnPosition.y] === SPAWN_POINT_ID;
    }

    replacePlayerOnNeighborTile(player: Player, gameMap: Game): Position {
        const neighbors = this.getNeighbors(player.spawnPosition, gameMap);
        for (const neighbor of neighbors) {
            if (gameMap.itemPlacement[neighbor.x][neighbor.y] === 0) {
                player.position = neighbor;
                return neighbor;
            }
        }
    }

    private getNeighbors(position: Position, game: Game): Position[] {
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

    private isValidTile(x: number, y: number, dimension: number): boolean {
        return x >= 0 && y >= 0 && x < dimension && y < dimension;
    }

    private defaultCombatWin(room: Room, player: Player, server: Server) {
        this.addVictory(room, player, server);
        server.to(player.id).emit('defaultWin');
    }

    private getOpponent(client: Socket): Player {
        return client.id === this.attacker.id ? this.defender : this.attacker;
    }
}
