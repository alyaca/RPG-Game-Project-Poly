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
    VICTORIES,
    XIPHOS_ATTACK_BONUS,
    XIPHOS_DEFENSE_PENALTY,
} from '@app/constants';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { ObjectType } from '@common/avatars-info';
import { TileType, XiphosEffect } from '@common/constants';
import { CombatInfos, CombatPlayers } from '@common/interfaces/combat-info';
import { Game } from '@common/interfaces/game';
import { Behavior, Player, Position, Status } from '@common/interfaces/player';
import { PlayerStatType } from '@common/interfaces/post-game-stat';
import { Room } from '@common/interfaces/room';
import { ActionData } from '@common/interfaces/socket-data.interface';
import { ServerToClientEvent } from '@common/socket.events';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

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

    startFight(client: Socket, server: Server, combatActionData: ActionData) {
        const room = this.roomService.getRoom(client);
        const { combatPlayers } = this.initializeCombatInfos(combatActionData, room);
        this.logService.sendGlobalCombatLog(room.roomId, server, combatPlayers, LogType.StartCombat);
        this.roomService.getTurnTimer(room.roomId).pauseTimer();
        const isActivePlayerAttacker = this.isAttacker(combatActionData.player, combatPlayers);
        this.emitToCombatPlayers(server, combatPlayers, ServerToClientEvent.StartFight, { combatPlayers, isActivePlayerAttacker });
        server.to(room.roomId).emit(ServerToClientEvent.CombatInProgress);
        this.onStartTurn(client, server, room);
    }

    onStartTurn(client: Socket, server: Server, room: Room) {
        const combatPlayers = this.combatInfos.get(room.roomId).combatPlayers;
        let turnTime = 0;
        if (this.isBothPlayersBot(combatPlayers)) {
            turnTime = 1;
        } else {
            turnTime = combatPlayers.attacker.attributes.evasion === 0 ? NO_EVASION_TIME : FIGHT_TIME;
        }

        if (
            combatPlayers.attacker.status === Status.Bot &&
            combatPlayers.attacker.attributes.currentHp < combatPlayers.attacker.attributes.totalHp &&
            combatPlayers.attacker.attributes.evasion !== 0 &&
            combatPlayers.attacker.behavior === Behavior.Defensive
        ) {
            this.evadingPlayer(client, server);
            return;
        }

        const combatInfos = this.combatInfos.get(room.roomId);
        if (!combatInfos.checkedXiphos) {
            this.checkXiphos(combatInfos.combatPlayers, server, room);
        }
        const timeToAttack = this.generateRandom(turnTime);
        this.setFightTimer(client, server, combatInfos);

        this.roomService.getFightTimer(room.roomId).resetTimer(turnTime, (timeRemaining: number) => {
            this.emitToCombatPlayers(server, combatPlayers, 'combatTime', timeRemaining);
            if (timeRemaining <= 0) {
                this.attackPlayer(client, server);
            }
            if (combatPlayers.attacker.status === Status.Bot && timeRemaining === timeToAttack) {
                this.attackPlayer(client, server);
                return;
            }
        });
    }
    setFightTimer(client: Socket, server: Server, combatInfos: CombatInfos) {
        const turnTime = combatInfos.combatPlayers.attacker.attributes.evasion === 0 ? NO_EVASION_TIME : FIGHT_TIME;
        this.roomService.getFightTimer(combatInfos.room.roomId).resetTimer(turnTime, (timeRemaining: number) => {
            this.emitToCombatPlayers(server, combatInfos.combatPlayers, ServerToClientEvent.CombatTime, timeRemaining);
            if (timeRemaining <= 0) {
                this.attackPlayer(client, server);
            }
        });
    }

    onEndTurn(client: Socket, server: Server, room: Room) {
        const combatInfos = this.combatInfos.get(room.roomId);
        const combatPlayers = combatInfos.combatPlayers;
        [combatPlayers.attacker, combatPlayers.defender] = [combatPlayers.defender, combatPlayers.attacker];
        this.emitToCombatPlayers(server, combatPlayers, ServerToClientEvent.CombatTurnEnded, { combatPlayers, failEvasion: combatInfos.failEvasion });
        combatInfos.failEvasion = false;
        this.onStartTurn(client, server, room);
    }

    attackPlayer(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const combatPlayers = this.combatInfos.get(room.roomId).combatPlayers;
        const debugMode = room.isDebug;
        const { attackValues, defenseValues } = this.getCombatValues(combatPlayers, debugMode);
        this.emitToCombatPlayers(server, combatPlayers, ServerToClientEvent.AttackValues, { attackValues, defenseValues });
        if (attackValues.total > defenseValues.total) {
            combatPlayers.defender.attributes.currentHp--;
            this.addToPostGameStats(room, combatPlayers, PlayerStatType.DamageDealt, PlayerStatType.DamageTaken);
            this.emitToCombatPlayers(server, combatPlayers, ServerToClientEvent.AttackSuccess, combatPlayers.attacker);
            this.logService.sendCombatActionLog(room.roomId, server, combatPlayers, LogType.AttackSuccess);
        } else {
            const shouldDamageSelf = this.checkAchillesArmor(combatPlayers.attacker);
            this.emitToCombatPlayers(server, combatPlayers, ServerToClientEvent.AttackFail, { attacker: combatPlayers.attacker, shouldDamageSelf });
            this.logService.sendCombatActionLog(room.roomId, server, combatPlayers, LogType.AttackFail);
        }
        this.logService.sendCombatResultLog(room.roomId, server, combatPlayers);
        this.checkCombatOutcome(client, combatPlayers, server);
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
            this.handleEvasionSuccess(client, server);
        } else {
            this.logService.sendCombatActionLog(room.roomId, server, combatPlayers, LogType.EvadeCombatFail);
            this.emitToCombatPlayers(server, combatPlayers, ServerToClientEvent.EvasionFail, combatPlayers.attacker);
            combatInfos.failEvasion = true;
            this.onEndTurn(client, server, room);
        }
    }

    handleEvasionSuccess(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const combatInfos = this.combatInfos.get(room.roomId);
        const combatPlayers = combatInfos.combatPlayers;
        this.logService.sendCombatActionLog(room.roomId, server, combatPlayers, LogType.EvadeCombatSuccess);
        this.logService.sendGlobalCombatLog(room.roomId, server, combatPlayers, LogType.NoWinnerCombat);
        this.emitToCombatPlayers(server, combatPlayers, ServerToClientEvent.EvasionSuccess, {
            listPlayers: room.listPlayers,
            player: combatPlayers.attacker,
        });
        this.addToPostGameStats(room, combatPlayers, PlayerStatType.Evasions, PlayerStatType.Evasions);
        this.addToPostGameStats(room, combatPlayers, PlayerStatType.Combats, PlayerStatType.Combats);
        server.to(room.roomId).emit(ServerToClientEvent.CombatOver);
        this.continueTurn(server, room);
        this.resetCombatState(room);
        this.combatInfos.delete(room.roomId);
    }

    handleCombatWon(winner: Player, server: Server, room: Room) {
        const combatPlayers = this.combatInfos.get(room.roomId).combatPlayers;
        const isWinnerAttacker = this.isAttacker(winner, combatPlayers);
        this.resetCombatState(room);
        this.logService.sendPlayerLog(room.roomId, server, winner, LogType.WinCombat);
        this.addVictory(combatPlayers, room, server, isWinnerAttacker);
        this.combatInfos.delete(room.roomId);
        server.to(room.roomId).emit(ServerToClientEvent.CombatOver);
    }

    continueTurn(server: Server, room: Room) {
        const activePlayer = this.gameService.getActivePlayer(room);
        const activePlayerSocket = server.sockets.sockets.get(activePlayer.id);
        setTimeout(() => {
            this.roomService.getTurnTimer(room.roomId).resumeTimer((timeRemaining) => {
                if (timeRemaining <= 0) {
                    this.gameService.onTurnEnded(room, server);
                }
                server.to(room.roomId).emit(ServerToClientEvent.StartedTurnTimer, timeRemaining);
            });
        }, END_COMBAT_DELAY);
    }

    manageTurnAfterCombat(winner: Player, server: Server, room: Room) {
        const activePlayer = this.gameService.getActivePlayer(room);
        const activePlayerSocket = server.sockets.sockets.get(activePlayer.id);
        if (activePlayer.id === winner.id) {
            this.continueTurn(server, room);
            const reachability = room.navigation.findReachableTiles(winner, room);
            server.to(room.roomId).emit(ServerToClientEvent.ReachableTiles, reachability);
        } else {
            setTimeout(() => {
                this.gameService.onTurnEnded(room, server);
            }, END_COMBAT_DELAY);
        }
    }

    disconnectedPlayer(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const winner = this.getOpponent(client);
        const nbSockets = server.sockets.adapter.rooms.get(room.roomId).size;
        this.logService.sendPlayerLog(room.roomId, server, winner, LogType.WinCombat);
        this.handleDefaultCombatWin(client, winner, server);
        if (winner.isActive && nbSockets > SINGLE_PLAYER) {
            this.continueTurn(server, room);
        }
    }

    isInCombat(client: Socket) {
        if (!this.combatInfos.has(client.data?.roomCode)) return false;
        const combatPlayers = this.combatInfos.get(client.data.roomCode).combatPlayers;
        return client.id === combatPlayers.attacker?.id || client.id === combatPlayers.defender?.id;
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

    private isBothPlayersBot(combatPlayers: CombatPlayers): boolean {
        return combatPlayers.attacker.status === Status.Bot && combatPlayers.defender.status === Status.Bot;
    }
    private generateRandom(max: number): number {
        return Math.floor(Math.random() * max + 1);
    }

    private initializeCombatInfos(combatActionData: ActionData, room: Room) {
        const { player } = combatActionData;
        const opponent = room.navigation.getCombatOpponent(combatActionData);
        if (!opponent) return;
        const gameTime = this.roomService.getTurnTimer(room.roomId).getTimeRemaining();
        const [attacker, defender] = opponent && player.attributes.speed < opponent.attributes.speed ? [opponent, player] : [player, opponent];
        const combatPlayers = { attacker, defender, combatResultDetails: DEFAULT_COMBAT_RESULT };
        const combatInfos: CombatInfos = {
            combatPlayers,
            gameTime,
            room,
            failEvasion: false,
            checkedXiphos: false,
        };
        this.handlePlayerOnIce(combatPlayers.attacker, room.gameMap.tiles, room.listPlayers);
        this.handlePlayerOnIce(combatPlayers.defender, room.gameMap.tiles, room.listPlayers);
        this.combatInfos.set(room.roomId, combatInfos);
        return combatInfos;
    }

    private isEvasionSuccessful() {
        return Math.random() < EVASION_SUCCESS_RATE;
    }

    private hasXiphos(player: Player) {
        return player.inventory.find((items) => items.id === ObjectType.Xiphos);
    }

    private isXiphosActive(player: Player): boolean {
        return this.hasXiphos(player) && this.hasHealthBelowHalf(player);
    }

    private hasHealthBelowHalf(player: Player) {
        return player.attributes.currentHp <= player.attributes.totalHp / 2;
    }

    private applyXiphosEffect(player: Player, opponent: Player, combatPlayers: CombatPlayers, roomId: string, server: Server) {
        player.attributes.attack += XIPHOS_ATTACK_BONUS;
        opponent.attributes.defense -= XIPHOS_DEFENSE_PENALTY;
        this.combatInfos.get(roomId).checkedXiphos = true;
        this.emitToCombatPlayers(server, combatPlayers, ServerToClientEvent.UpdateStats, combatPlayers);
    }

    private isAttacker(player: Player, combatPlayers: CombatPlayers) {
        return player.id === combatPlayers.attacker.id;
    }

    private isPlayerAffectedByXiphos(player: Player, checkedXiphos: boolean) {
        return this.hasXiphos(player) && checkedXiphos;
    }

    private resetCombatState(room: Room) {
        const { combatPlayers, checkedXiphos } = this.combatInfos.get(room.roomId);
        this.roomService.getFightTimer(room.roomId).stopTimer();
        this.removeXiphosEffect(combatPlayers, checkedXiphos);
        room.listPlayers.forEach((player) => {
            this.resetPlayerHealth(player);
        });
    }

    private removeXiphosEffect(combatPlayers: CombatPlayers, checkedXiphos: boolean) {
        const { attacker, defender } = combatPlayers;
        if (this.isPlayerAffectedByXiphos(attacker, checkedXiphos)) {
            this.updateXiphosAttributes(attacker, defender);
        } else if (this.isPlayerAffectedByXiphos(defender, checkedXiphos)) {
            this.updateXiphosAttributes(defender, attacker);
        }
    }

    private updateXiphosAttributes(playerAffected: Player, opponent: Player) {
        playerAffected.attributes.attack -= XiphosEffect.Attack;
        opponent.attributes.defense += XiphosEffect.Defense;
    }

    private resetPlayerHealth(player) {
        player.attributes.currentHp = player.attributes.totalHp;
    }

    private resetPlayerIcePenalty(room: Room, player: Player) {
        if (room.gameMap.tiles[player.position.x][player.position.y] === TileType.Ice) {
            player.attributes.attack += ICE_TILE_PENALTY_VALUE;
            player.attributes.defense += ICE_TILE_PENALTY_VALUE;
        }
    }

    private managePlayerDeath(client: Socket, winner: Player, loser: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        this.gameService.placeItemsOnGround(room, server, loser);
        this.replacePlayerOnSpawnPoint(loser, server, room);
        this.manageTurnAfterCombat(winner, server, room);
        this.handleCombatWon(winner, server, room);
        this.resetPlayerIcePenalty(room, winner);
        this.resetPlayerIcePenalty(room, loser);
        this.emitToCombatPlayers(server, { attacker: winner, defender: loser }, ServerToClientEvent.UpdateStats, { winner, loser });
    }

    private checkCombatOutcome(client: Socket, combatPlayers: CombatPlayers, server: Server) {
        const room = this.roomService.getRoom(client);
        const { attacker, defender } = combatPlayers;
        if (defender.attributes.currentHp <= 0) {
            this.managePlayerDeath(client, attacker, defender, server);
            return;
        } else if (attacker.attributes.currentHp <= 0) {
            this.managePlayerDeath(client, defender, attacker, server);
            return;
        }
        setTimeout(() => {
            this.onEndTurn(client, server, room);
        }, ROLL_DURATION);
    }

    private checkEndGame(player: Player, room: Room, server: Server) {
        if (player.postGameStats.victories >= VICTORIES) {
            this.gameService.onEndGame(player, room, server);
            this.logService.sendEndGameLog(room.listPlayers, room.roomId, server);
        } else {
            server.to(room.roomId).emit(ServerToClientEvent.CombatEnd, { listPlayers: room.listPlayers, player });
        }
    }

    private checkXiphos(combatPlayers: CombatPlayers, server: Server, room: Room) {
        const { attacker, defender } = combatPlayers;
        if (this.isXiphosActive(attacker)) {
            this.applyXiphosEffect(attacker, defender, combatPlayers, room.roomId, server);
        }

        if (this.isXiphosActive(defender)) {
            this.applyXiphosEffect(defender, attacker, combatPlayers, room.roomId, server);
        }
    }

    private checkAchillesArmor(player: Player) {
        if (this.hasAchillesArmor(player)) {
            player.attributes.currentHp--;
            return true;
        }
        return false;
    }

    private hasAchillesArmor(player: Player) {
        return player.inventory.find((items) => items.id === ObjectType.Armor);
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

    private replacePlayerOnSpawnPoint(player: Player, server: Server, room: Room) {
        const players = room.listPlayers;
        const playerToReplace = room.listPlayers.find((p) => p.id === player.id);
        if (!playerToReplace) return;
        room.gameMap.itemPlacement[playerToReplace.position.x][playerToReplace.position.y] = 0;
        if (this.checkSpawnPointAvailability(playerToReplace, players)) {
            const oldPosition = playerToReplace.position;
            playerToReplace.position = playerToReplace.spawnPosition;
            server.to(room.roomId).emit(ServerToClientEvent.RespawnPlayer, { oldPosition, playerToReplace });
        } else {
            const oldPosition = playerToReplace.position;
            this.replacePlayerOnNeighborTile(playerToReplace, room.gameMap);
            server.to(room.roomId).emit(ServerToClientEvent.RespawnPlayer, { oldPosition, playerToReplace });
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

    private handleDefaultCombatWin(client: Socket, player: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        server.to(player.id).emit(ServerToClientEvent.DefaultCombatWin);
        this.handleCombatWon(player, server, room);
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
