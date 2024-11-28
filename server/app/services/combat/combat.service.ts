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
import { ObjectType } from '@common/avatars-info';
import { CombatInfos } from '@common/combat-info';
import { CombatPlayers } from '@common/combat-player';
import { Game } from '@common/game';
import { Player, Position } from '@common/player';
import { PlayerStatType } from '@common/post-game-stat';
import { Room } from '@common/room';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/* eslint-disable max-len */
/* eslint-disable max-lines */
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
            checkedXiphos: false,
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

    checkXiphos(combatPlayers: CombatPlayers, server: Server, room: Room) {
        if (combatPlayers.attacker.inventory.find((items) => items.id === ObjectType.Xiphos)) {
            if (combatPlayers.attacker.attributes.currentHp <= combatPlayers.attacker.attributes.totalHp / 2) {
                combatPlayers.attacker.attributes.attack += 2;
                combatPlayers.defender.attributes.defense -= 1;
                this.combatInfos.get(room.roomId).checkedXiphos = true;
                this.emitToCombatPlayers(server, combatPlayers, 'updateStats', {
                    attacker: combatPlayers.attacker,
                    defender: combatPlayers.defender,
                });
                return combatPlayers;
            }
        } else if (combatPlayers.defender.inventory.find((items) => items.id === ObjectType.Xiphos)) {
            if (combatPlayers.defender.attributes.currentHp <= combatPlayers.defender.attributes.totalHp / 2) {
                combatPlayers.defender.attributes.attack += 2;
                combatPlayers.attacker.attributes.defense -= 1;
                this.combatInfos.get(room.roomId).checkedXiphos = true;
                this.emitToCombatPlayers(server, combatPlayers, 'updateStats', {
                    attacker: combatPlayers.attacker,
                    defender: combatPlayers.defender,
                });
                return combatPlayers;
            }
        }
        return combatPlayers;
    }

    onStartTurn(client: Socket, server: Server, room: Room) {
        const combatInfos = this.combatInfos.get(room.roomId);
        if (!combatInfos.checkedXiphos) {
            combatInfos.combatPlayers = this.checkXiphos(combatInfos.combatPlayers, server, room);
        }
        this.setFightTimer(client, server, combatInfos);
    }

    setFightTimer(client: Socket, server: Server, combatInfos: CombatInfos) {
        const turnTime = combatInfos.combatPlayers.attacker.attributes.evasion === 0 ? NO_EVASION_TIME : FIGHT_TIME;
        this.roomService.getFightTimer(combatInfos.room.roomId).resetTimer(turnTime, (timeRemaining: number) => {
            this.emitToCombatPlayers(server, combatInfos.combatPlayers, 'combatTime', timeRemaining);
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

    checkAchillesArmor(combatPlayers: CombatPlayers) {
        if (combatPlayers.attacker.inventory.find((objects) => objects.id === ObjectType.Armor)) {
            combatPlayers.attacker.attributes.currentHp--;
            return true;
        }
        return false;
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
            const shouldDamageSelf = this.checkAchillesArmor(combatPlayers);
            this.emitToCombatPlayers(server, combatPlayers, 'attackFail', { attacker: combatPlayers.attacker, shouldDamageSelf });
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
            this.onEvasionSuccess(client, server);
        } else {
            this.logService.sendCombatActionLog(room.roomId, server, combatPlayers, LogType.EvadeCombatFail);
            this.emitToCombatPlayers(server, combatPlayers, 'evasionFail', combatPlayers.attacker);
            combatInfos.failEvasion = true;
            this.onEndTurn(client, server, room);
        }
    }

    onEvasionSuccess(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const combatInfos = this.combatInfos.get(room.roomId);
        const combatPlayers = combatInfos.combatPlayers;
        this.logService.sendCombatActionLog(room.roomId, server, combatPlayers, LogType.EvadeCombatSuccess);
        this.logService.sendGlobalCombatLog(room.roomId, server, combatPlayers, LogType.NoWinnerCombat);
        this.emitToCombatPlayers(server, combatPlayers, 'evasionSuccess', { listPlayers: room.listPlayers, player: combatPlayers.attacker });
        this.addToPostGameStats(room, combatPlayers, PlayerStatType.Evasions, PlayerStatType.Evasions);
        this.addToPostGameStats(room, combatPlayers, PlayerStatType.Combats, PlayerStatType.Combats);
        server.to(room.roomId).emit('combatOver');
        this.continueTurn(client, server);
        this.combatInfos.delete(room.roomId);
    }

    combatWon(client: Socket, winner: Player, server: Server, attackerWon: boolean) {
        const room = this.roomService.getRoom(client);
        const combatPlayers = this.combatInfos.get(client.data.roomCode).combatPlayers;
        this.resetCombatState(room, combatPlayers);
        this.logService.sendPlayerLog(room.roomId, server, winner, LogType.WinCombat);
        this.addVictory(combatPlayers, room, server, attackerWon);
        this.combatInfos.delete(room.roomId);
        server.to(room.roomId).emit('combatOver');
    }

    continueTurn(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const activePlayer = this.gameService.getActivePlayer(room);
        const activePlayerSocket = server.sockets.sockets.get(activePlayer.id);
        this.resetCombatState(room, this.combatInfos.get(room.roomId).combatPlayers);
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
            this.resetCombatState(room, this.combatInfos.get(room.roomId).combatPlayers);
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

    private hasXiphos(player: Player) {
        return player.inventory.find((items) => items.id === ObjectType.Xiphos);
    }

    private resetCombatState(room: Room, combatPlayers: CombatPlayers) {
        const attacker = combatPlayers.attacker;
        const defender = combatPlayers.defender;
        const hasCheckedXiphos = this.combatInfos.get(room.roomId).checkedXiphos;
        let attackerAffected = false;
        let defenderAffected = false;
        if (this.hasXiphos(attacker) && hasCheckedXiphos) {
            attackerAffected = true;
        }
        if (this.hasXiphos(defender) && hasCheckedXiphos) {
            defenderAffected = true;
        }

        this.roomService.getFightTimer(room.roomId).stopTimer();
        room.listPlayers.forEach((player) => {
            if (attackerAffected) {
                if (player.name === attacker.name) {
                    player.attributes.attack -= 2;
                }
                if (player.name === defender.name) {
                    player.attributes.defense += 1;
                }
            }
            if (defenderAffected) {
                if (player.name === attacker.name) {
                    player.attributes.defense += 1;
                }
                if (player.name === defender.name) {
                    player.attributes.attack -= 2;
                }
            }
            player.attributes.currentHp = player.attributes.totalHp;
        });
    }

    private resetAttackerIce(room: Room, attacker: Player) {
        if (room.gameMap.tiles[attacker.position.x][attacker.position.y] === TileType.Ice) {
            attacker.attributes.attack += 2;
            attacker.attributes.defense += 2;
            return attacker;
        }
        return attacker;
    }

    private resetDefenderIce(room: Room, defender: Player) {
        if (room.gameMap.tiles[defender.position.x][defender.position.y] === TileType.Ice) {
            defender.attributes.attack += 2;
            defender.attributes.defense += 2;
            return defender;
        }
        return defender;
    }

    private checkIfPlayerIsDead(client: Socket, defender: Player, attacker: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        if (defender.attributes.currentHp <= 0) {
            this.gameService.placeItemsOnGround(client, server, defender);
            this.replacePlayerOnSpawnPoint(defender, client, server);
            this.manageTurnAfterCombat(client, defender, attacker, server);
            this.combatWon(client, attacker, server, true);
            attacker = this.resetAttackerIce(room, attacker);
            defender = this.resetDefenderIce(room, defender);
            this.emitToCombatPlayers(server, { attacker, defender }, 'updateStats', { attacker, defender });
            return true;
        } else if (attacker.attributes.currentHp <= 0) {
            this.gameService.placeItemsOnGround(client, server, attacker);
            this.replacePlayerOnSpawnPoint(attacker, client, server);
            this.manageTurnAfterCombat(client, attacker, defender, server);
            this.combatWon(client, defender, server, false);
            attacker = this.resetAttackerIce(room, attacker);
            defender = this.resetDefenderIce(room, defender);
            this.emitToCombatPlayers(server, { attacker, defender }, 'updateStats', { attacker, defender });
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

    private addStatsForWinLoss(room: Room, combatPlayers: CombatPlayers, attackerWon: boolean) {
        const attacker = room.listPlayers.find((players) => players.id === combatPlayers.attacker.id);
        const defender = room.listPlayers.find((players) => players.id === combatPlayers.defender.id);
        if (attacker && defender) {
            if (attackerWon) {
                attacker.postGameStats.victories++;
                defender.postGameStats.defeats++;
                return attacker;
            } else {
                attacker.postGameStats.defeats--;
                defender.postGameStats.victories++;
                return defender;
            }
        }
    }

    private addVictory(combatPlayers: CombatPlayers, room: Room, server: Server, attackerWon: boolean) {
        const playerWinner = this.addStatsForWinLoss(room, combatPlayers, attackerWon);

        this.addToPostGameStats(room, combatPlayers, PlayerStatType.Combats, PlayerStatType.Combats);
        this.checkEndGame(playerWinner, room, server);
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
        this.combatWon(client, player, server, true);
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
