import { EVASION_LUCK, EVASION_RANDOM, VICTORIES } from '@app/constants';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { CombatInfo } from '@common/combat-info';
import { Player } from '@common/player';
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
        const attackValue = this.attacker.attributes.attack + this.getDiceValue(this.attacker.attributes.atkDiceMax);
        const defenseValue = this.defender.attributes.defense + this.getDiceValue(this.defender.attributes.defDiceMax);
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
        if (this.isEvasionSuccessful) {
            this.emitToCombatPlayers(server, 'evasionSuccess', player);
            this.emitToCombatPlayers(server, 'combatEnd', room.listPlayers);
        } else {
            this.emitToCombatPlayers(server, 'evasionFail');
        }
    }

    isEvasionSuccessful() {
        return EVASION_LUCK < this.getDiceValue(EVASION_RANDOM);
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
            this.emitToCombatPlayers(server, 'startedTurnTimer', timeRemaining);
        });
    }

    combatEnded(room: Room) {
        this.roomService.getFightTimer(room.roomId).stopTimer();
        room.listPlayers.forEach((player) => {
            player.attributes.currentHp = player.attributes.totalHp;
        });
    }

    checkIfPlayerIsDead(client: Socket, defender: Player, attacker: Player, server: Server) {
        if (defender.attributes.currentHp <= 0) {
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

    getDiceValue(max: number) {
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
        return client.id === this.attacker.id || client.id === this.defender.id;
    }

    addVictory(room: Room, player: Player, server: Server) {
        const playerWinner = room.listPlayers.find((p) => p.id === player.id);
        playerWinner.victories++;
        this.checkEndGame(playerWinner, room, server);
        server.to(room.roomId).emit('combatEnd', room.listPlayers);
    }

    private defaultCombatWin(room: Room, player: Player, server: Server) {
        this.addVictory(room, player, server);
        server.to(player.id).emit('defaultWin');
    }

    private getOpponent(client: Socket): Player {
        return client.id === this.attacker.id ? this.defender : this.attacker;
    }
}
