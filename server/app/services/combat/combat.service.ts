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

    startFight(client: Socket, player1: Player, player2: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        this.attacker = player1;
        this.defender = player2;

        this.gameTime = this.roomService.getTurnTimer(room.roomId).getTimeRemaining();
        this.roomService.getTurnTimer(room.roomId).pauseTimer();
        this.emitToCombatPlayers(server, 'startFight', { player1, player2 });
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
        this.emitToCombatPlayers(server, 'combatTurnEnded', this.attacker);
        this.onStartTurn(client, server, room);
    }

    attackPlayer(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const attackValue = this.attacker.attributes.attack + this.getRandom(this.attacker.attributes.atkDiceMax);
        const defenseValue = this.defender.attributes.defense + this.getRandom(this.defender.attributes.defDiceMax);
        this.emitToCombatPlayers(server, 'attackValues', {
            activePlayer: { player: this.attacker, attackValue },
            defensePlayer: { player: this.defender, defenseValue },
        });
        if (attackValue > defenseValue) {
            this.defender.attributes.currentHp--;
            this.emitToCombatPlayers(server, 'attackSuccess', this.defender);
            if (this.checkIfPlayerIsDead(client, this.defender, this.attacker, server)) {
                return;
            }
        } else if (attackValue < defenseValue) {
            this.emitToCombatPlayers(server, 'attackFail', this.attacker);
        } else {
            this.emitToCombatPlayers(server, 'drawCombat');
        }
        this.onEndTurn(client, server, room);
    }

    evadingPlayer(client: Socket, player: Player, server: Server) {
        if (this.isEvasionSuccessful) {
            this.emitToCombatPlayers(server, 'evasionSuccess', player);
        }
    }

    isEvasionSuccessful() {
        return EVASION_LUCK < this.getRandom(EVASION_RANDOM);
    }

    isCombatFinish(client: Socket, defender: Player, attacker: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        const playerWinner = room.listPlayers.find((p) => p.id === attacker.id);
        playerWinner.victories++;
        this.emitToCombatPlayers(server, 'playerDead', defender);
        this.checkEndGame(playerWinner, room, server);
        this.emitToCombatPlayers(server, 'combatEnd', room.listPlayers);
    }

    continueTurn(client: Socket, defender: Player, attacker: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        this.roomService.getTurnTimer(room.roomId).resumeTimer((timeRemaining) => {
            if (timeRemaining <= 0) {
                this.emitToCombatPlayers(server, 'turnEnded', room.listPlayers);
                this.gameService.onTurnEnded(client, server);
            }
            this.emitToCombatPlayers(server, 'startedTurnTimer', timeRemaining);
        });
        defender.attributes.currentHp = defender.attributes.totalHp;
        attacker.attributes.currentHp = attacker.attributes.totalHp;
    }

    checkIfPlayerIsDead(client: Socket, defender: Player, attacker: Player, server: Server) {
        if (defender.attributes.currentHp <= 0) {
            this.isCombatFinish(client, defender, attacker, server);
            this.continueTurn(client, defender, attacker, server);
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

    getRandom(max: number) {
        return Math.floor(Math.random() * max + 1);
    }
}
