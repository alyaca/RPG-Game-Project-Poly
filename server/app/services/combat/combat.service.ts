import {
    DEFAULT_COMBAT_RESULT,
    END_COMBAT_DELAY,
    EVASION_SUCCESS_RATE,
    FIGHT_TIME,
    ICE_TILE_PENALTY_VALUE,
    LogType,
    MIN_DICE_VALUE,
    NO_EVASION_TIME,
    ROLL_DURATION,
    SINGLE_PLAYER,
    TileType,
    VICTORIES,
} from '@app/constants';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { CombatInfos } from '@common/combat-info';
import { CombatPlayers } from '@common/combat-player';
import { Game } from '@common/game';
import { Player, Position } from '@common/player';
import { PlayerStatType } from '@common/post-game-stat';
import { Room } from '@common/room';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class CombatService {
    combatInfos = new Map<string, CombatInfos>();

    constructor(
        private roomService: RoomService,
        private gameService: GameService,
        private logService: GameLogsService,
    ) {}

    emitToCombatPlayers(server: Server, players: CombatPlayers, event: string, data?) {
        server.to(players.attacker.id).emit(event, data);
        server.to(players.defender.id).emit(event, data);
    }

    startFight(client: Socket, player1: Player, player2: Player, isPlayer1Active: boolean, server: Server) {
        const room = this.roomService.getRoom(client);
        const gameTime = this.roomService.getTurnTimer(room.roomId).getTimeRemaining();
        const combatPlayers = { attacker: player1, defender: player2, combatResultDetails: DEFAULT_COMBAT_RESULT };
        const combatInfos: CombatInfos = {
            combatPlayers,
            gameTime,
            room,
            failEvasion: false,
        };
        this.handlePlayerOnIce(combatPlayers.attacker, room.gameMap.tiles, room.listPlayers);
        this.handlePlayerOnIce(combatPlayers.defender, room.gameMap.tiles, room.listPlayers);

        this.logService.sendGlobalCombatLog(room.roomId, server, combatPlayers, LogType.StartCombat);
        this.combatInfos.set(room.roomId, combatInfos);
        this.roomService.getTurnTimer(room.roomId).pauseTimer();
        this.emitToCombatPlayers(server, combatPlayers, 'startFight', { player1, player2, isPlayer1Active });
        server.to(room.roomId).emit('combatInProgress');
        this.onStartTurn(client, server, room);
    }

    onStartTurn(client: Socket, server: Server, room: Room) {
        const combatPlayers = this.combatInfos.get(room.roomId).combatPlayers;
        const turnTime = combatPlayers.attacker.attributes.evasion === 0 ? NO_EVASION_TIME : FIGHT_TIME;
        this.roomService.getFightTimer(room.roomId).resetTimer(turnTime, (timeRemaining: number) => {
            this.emitToCombatPlayers(server, combatPlayers, 'combatTime', timeRemaining);
            if (timeRemaining <= 0) {
                this.attackPlayer(client, server);
            }
        });
    }

    onEndTurn(client: Socket, server: Server, room: Room) {
        const combatInfos = this.combatInfos.get(room.roomId);
        const combatPlayers = combatInfos.combatPlayers;
        [combatPlayers.attacker, combatPlayers.defender] = [combatPlayers.defender, combatPlayers.attacker];
        this.emitToCombatPlayers(server, combatPlayers, 'combatTurnEnded', { combatPlayers, failEvasion: combatInfos.failEvasion });
        combatInfos.failEvasion = false;
        this.onStartTurn(client, server, room);
    }

    attackPlayer(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const combatPlayers = this.combatInfos.get(room.roomId).combatPlayers;
        const debugMode = room.isDebug;
        const { attackValues, defenseValues } = this.getCombatValues(combatPlayers, debugMode);
        this.emitToCombatPlayers(server, combatPlayers, 'attackValues', { attackValues, defenseValues });
        if (attackValues.total > defenseValues.total) {
            combatPlayers.defender.attributes.currentHp--;
            this.addToPostGameStats(room, combatPlayers, PlayerStatType.DamageDealt, PlayerStatType.DamageTaken);
            this.emitToCombatPlayers(server, combatPlayers, 'attackSuccess', combatPlayers.attacker);
            this.logService.sendCombatActionLog(room.roomId, server, combatPlayers, LogType.AttackSuccess);
        } else {
            this.emitToCombatPlayers(server, combatPlayers, 'attackFail', combatPlayers.attacker);
            this.logService.sendCombatActionLog(room.roomId, server, combatPlayers, LogType.AttackFail);
        }
        this.logService.sendCombatCombatResultLog(room.roomId, server, combatPlayers);
        const isPlayerDead = this.checkIfPlayerIsDead(client, combatPlayers.defender, combatPlayers.attacker, server);
        if (!isPlayerDead) {
            setTimeout(() => {
                this.onEndTurn(client, server, room);
            }, ROLL_DURATION);
        }
    }

    getCombatValues(combatPlayers: CombatPlayers, debugMode: boolean) {
        const attackDiceValue = debugMode
            ? combatPlayers.attacker.attributes.atkDiceMax
            : this.getRandomValue(combatPlayers.attacker.attributes.atkDiceMax);
        const attackValues = {
            total: combatPlayers.attacker.attributes.attack + attackDiceValue,
            diceValue: attackDiceValue,
        };
        const defenseDiceValue = debugMode ? MIN_DICE_VALUE : this.getRandomValue(combatPlayers.defender.attributes.defDiceMax);
        const defenseValues = {
            total: combatPlayers.defender.attributes.defense + defenseDiceValue,
            diceValue: defenseDiceValue,
        };
        combatPlayers.combatResultDetails = { attackValues, defenseValues };
        return { attackValues, defenseValues };
    }

    evadingPlayer(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const combatInfos = this.combatInfos.get(room.roomId);
        const combatPlayers = combatInfos.combatPlayers;
        combatPlayers.attacker.attributes.evasion--;
        if (this.isEvasionSuccessful()) {
            this.logService.sendCombatActionLog(room.roomId, server, combatPlayers, LogType.EvadeCombatSuccess);
            this.logService.sendGlobalCombatLog(room.roomId, server, combatPlayers, LogType.NoWinnerCombat);
            this.emitToCombatPlayers(server, combatPlayers, 'evasionSuccess', { listPlayers: room.listPlayers, player: combatPlayers.attacker });
            this.addToPostGameStats(room, combatPlayers, PlayerStatType.Evasions, PlayerStatType.Evasions);
            this.addToPostGameStats(room, combatPlayers, PlayerStatType.Combats, PlayerStatType.Combats);
            server.to(room.roomId).emit('combatOver');
            this.continueTurn(client, server);
            this.combatInfos.delete(room.roomId);
        } else {
            this.logService.sendCombatActionLog(room.roomId, server, combatPlayers, LogType.EvadeCombatFail);
            this.emitToCombatPlayers(server, combatPlayers, 'evasionFail', combatPlayers.attacker);
            combatInfos.failEvasion = true;
            this.onEndTurn(client, server, room);
        }
    }

    combatWon(client: Socket, winner: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        const combatPlayers = this.combatInfos.get(client.data.roomCode).combatPlayers;
        this.resetCombatState(room);
        this.logService.sendPlayerLog(room.roomId, server, winner, LogType.WinCombat);
        this.addVictory(combatPlayers, room, server);
        server.to(room.roomId).emit('combatOver');
    }

    continueTurn(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const activePlayer = this.gameService.getActivePlayer(room);
        const activePlayerSocket = server.sockets.sockets.get(activePlayer.id);
        this.resetCombatState(room);
        setTimeout(() => {
            this.roomService.getTurnTimer(room.roomId).resumeTimer((timeRemaining) => {
                if (timeRemaining <= 0) {
                    this.gameService.onTurnEnded(activePlayerSocket, server);
                }
                server.to(room.roomId).emit('startedTurnTimer', timeRemaining);
            });
        }, END_COMBAT_DELAY);
    }

    manageTurnAfterCombat(client: Socket, defender: Player, attacker: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        const activePlayer = this.gameService.getActivePlayer(room);
        const activePlayerSocket = server.sockets.sockets.get(activePlayer.id);
        if (activePlayer.id !== defender.id) {
            this.continueTurn(client, server);
            const reachability = room.navigation.findReachableTiles(attacker, room);
            server.to(room.roomId).emit('reachableTiles', reachability);
        } else {
            this.resetCombatState(room);
            setTimeout(() => {
                this.gameService.onTurnEnded(activePlayerSocket, server);
            }, END_COMBAT_DELAY);
        }
    }

    disconnectedPlayer(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const winner = this.getOpponent(client);
        const nbSockets = server.sockets.adapter.rooms.get(room.roomId).size;
        this.logService.sendPlayerLog(room.roomId, server, winner, LogType.WinCombat);
        this.defaultCombatWin(client, winner, server);
        if (winner.isActive && nbSockets > SINGLE_PLAYER) {
            const winnerSocket = server.sockets.sockets.get(winner.id);
            this.continueTurn(winnerSocket, server);
        }
    }

    isInCombat(client: Socket) {
        if (!this.combatInfos.has(client.data?.roomCode)) return false;
        const combatPlayers = this.combatInfos.get(client.data.roomCode).combatPlayers;
        return client.id === combatPlayers.attacker?.id || client.id === combatPlayers.defender?.id;
    }

    private isEvasionSuccessful() {
        return Math.random() < EVASION_SUCCESS_RATE;
    }

    private resetCombatState(room: Room) {
        this.roomService.getFightTimer(room.roomId).stopTimer();
        this.combatInfos.delete(room.roomId);
        room.listPlayers.forEach((player) => {
            player.attributes.currentHp = player.attributes.totalHp;
        });
    }

    private checkIfPlayerIsDead(client: Socket, defender: Player, attacker: Player, server: Server) {
        if (defender.attributes.currentHp <= 0) {
            this.replacePlayerOnSpawnPoint(defender, client, server);
            this.combatWon(client, attacker, server);
            this.manageTurnAfterCombat(client, defender, attacker, server);
            return true;
        }
        return false;
    }

    private checkEndGame(player: Player, room: Room, server: Server) {
        if (player.postGameStats.victories >= VICTORIES) {
            this.gameService.onEndGame(player, room, server);
            this.logService.sendEndGameLog(room.listPlayers, room.roomId, server);
        } else {
            server.to(room.roomId).emit('combatEnd', { listPlayers: room.listPlayers, player });
        }
    }

    private addVictory(combatPlayers: CombatPlayers, room: Room, server: Server) {
        const playerWinner = this.addToPostGameStats(room, combatPlayers, PlayerStatType.Victories, PlayerStatType.Defeats);

        this.addToPostGameStats(room, combatPlayers, PlayerStatType.Combats, PlayerStatType.Combats);
        this.checkEndGame(playerWinner, room, server);
        this.combatInfos.delete(room.roomId);
    }

    private addToPostGameStats(room: Room, players: CombatPlayers, attr1: string, attr2: string): Player | null {
        const attacker = room.listPlayers.find((p) => p.id === players.attacker.id);
        const defender = room.listPlayers.find((p) => p.id === players.defender.id);
        if (attacker && defender) {
            attacker.postGameStats[attr1 as keyof Player['postGameStats']]++;
            defender.postGameStats[attr2 as keyof Player['postGameStats']]++;
            return attacker;
        }
        return null;
    }

    private replacePlayerOnSpawnPoint(player: Player, socket: Socket, server: Server) {
        const room = this.roomService.getRoom(socket);
        const players = room.listPlayers;
        const playerToReplace = room.listPlayers.find((p) => p.id === player.id);
        if (!playerToReplace) return;
        room.gameMap.itemPlacement[playerToReplace.position.x][playerToReplace.position.y] = 0;
        if (this.checkSpawnPointAvailability(playerToReplace, players)) {
            const oldPosition = playerToReplace.position;
            playerToReplace.position = playerToReplace.spawnPosition;
            server.to(room.roomId).emit('respawnPlayer', { oldPosition, playerToReplace });
        } else {
            const oldPosition = playerToReplace.position;
            this.replacePlayerOnNeighborTile(playerToReplace, room.gameMap);
            server.to(room.roomId).emit('respawnPlayer', { oldPosition, playerToReplace });
        }
    }

    private checkSpawnPointAvailability(player: Player, players: Player[]): boolean {
        for (const p of players) {
            if (p.id === player.id) continue;
            if (p.position.x === player.spawnPosition.x && p.position.y === player.spawnPosition.y) {
                return false;
            }
        }
        return true;
    }

    private replacePlayerOnNeighborTile(player: Player, gameMap: Game): Position {
        const neighbors = this.getNeighbors(player.spawnPosition, gameMap);
        for (const neighbor of neighbors) {
            if (gameMap.itemPlacement[neighbor.x][neighbor.y] === 0) {
                player.position = neighbor;
                return neighbor;
            }
        }
        player.position = neighbors[0];
        return this.replacePlayerOnNeighborTile(player, gameMap);
    }

    private getRandomValue(max: number) {
        return Math.floor(Math.random() * max + 1);
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

    private defaultCombatWin(client: Socket, player: Player, server: Server) {
        server.to(player.id).emit('defaultWin');
        this.combatWon(client, player, server);
    }

    private getOpponent(client: Socket) {
        const combatPlayers = this.combatInfos.get(client.data?.roomCode)?.combatPlayers;
        if (!combatPlayers) return;
        return client.id === combatPlayers.attacker.id ? combatPlayers.defender : combatPlayers.attacker;
    }

    private handlePlayerOnIce(player: Player, tiles: number[][], listPlayers: Player[]) {
        const playerInRoom = listPlayers.find((p) => p.id === player.id);
        const { x, y } = playerInRoom.position;
        if (tiles[x][y] === TileType.Ice) {
            player.attributes.attack -= ICE_TILE_PENALTY_VALUE;
            player.attributes.defense -= ICE_TILE_PENALTY_VALUE;
        }
    }
}
