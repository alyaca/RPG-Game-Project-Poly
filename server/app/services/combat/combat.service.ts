import { CombatInfo } from '@common/combat-info';
import { Player } from '@common/player';
import { Room } from '@common/room';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from '../game/game.service';
import { RoomService } from '../room/room.service';

@Injectable()
export class CombatService {
    constructor(
        private roomService: RoomService,
        private gameService: GameService,
    ) {}
    combatInfos = new Map<string, CombatInfo>();
    activePlayer: Player;
    defensePlayer: Player;
    private gameTime: number;

    startFight(client: Socket, player1: Player, player2: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        this.activePlayer = player1;
        this.defensePlayer = player2;
        this.gameTime = this.roomService.getTurnTimer(room.roomId).getTimeRemaining();
        this.roomService.getTurnTimer(room.roomId).pauseTimer();
        server.to(room.roomId).emit('startFight', { player1, player2 });
        this.onStartTurn(client, server, room);
    }

    onStartTurn(client: Socket, server: Server, room: Room) {
        this.roomService.getFightTimer(room.roomId).resetTimer(5, (timeRemaining: number) => {
            server.to(room.roomId).emit('combatTime', timeRemaining);
            if (timeRemaining <= 0) {
                this.attackPlayer(client, server);
            }
        });
    }

    onEndTurn(client: Socket, server: Server, room: Room) {
        [this.activePlayer, this.defensePlayer] = [this.defensePlayer, this.activePlayer];
        server.to(room.roomId).emit('combatTurnEnded', this.activePlayer);
        this.onStartTurn(client, server, room);
    }

    attackPlayer(client: Socket, server: Server) {
        const room = this.roomService.getRoom(client);
        const attackValue = this.activePlayer.attributes.attack + this.getRandom(this.activePlayer.attributes.atkDiceMax);
        const defenseValue = this.defensePlayer.attributes.defense + this.getRandom(this.defensePlayer.attributes.defDiceMax);
        server.emit('attackValues', {
            activePlayer: { player: this.activePlayer, attackValue },
            defensePlayer: { player: this.defensePlayer, defenseValue },
        });
        if (attackValue > defenseValue) {
            this.defensePlayer.attributes.currentHp--;
            server.emit('attackSuccess', this.defensePlayer);
            this.checkIfPlayerIsDead(client, this.defensePlayer, this.activePlayer, server);
        } else if (attackValue < defenseValue) {
            this.activePlayer.attributes.currentHp--;
            server.emit('attackFail', this.activePlayer);
            this.checkIfPlayerIsDead(client, this.activePlayer, this.defensePlayer, server);
        } else {
            server.emit('drawCombat');
        }
        this.onEndTurn(client, server, room);
    }

    evadingPlayer(client: Socket, player: Player, server: Server) {
        if (this.isEvasionSuccessful) {
            server.emit('evasionSuccess', player);
        }
    }

    isEvasionSuccessful() {
        return 40 < this.getRandom(100);
    }

    checkIfPlayerIsDead(client: Socket, player1: Player, player2: Player, server: Server) {
        if (player1.attributes.currentHp <= 0) {
            const room = this.roomService.getRoom(client);
            player2.victories++;
            console.log('player2 victories: ', player2.victories);
            const playerIndex = room.listPlayers.findIndex((p) => p.id === player2.id);
            if (playerIndex !== -1) {
                room.listPlayers[playerIndex] = player2;
            }
            this.checkEndGame(room.listPlayers, server);
            server.emit('playerDead', player1);
            setTimeout(() => {
                server.emit('combatEnd', room.listPlayers);
            }, 3000);

            this.roomService.getTurnTimer(room.roomId).resumeTimer((timeRemaining) => {
                if (timeRemaining <= 0) {
                    server.emit('turnEnded', room.listPlayers);
                    this.gameService.onTurnEnded(client, server);
                }
                server.to(room.roomId).emit('startedTurnTimer', timeRemaining);
            });
            player1.attributes.currentHp = player1.attributes.totalHp;
            player2.attributes.currentHp = player2.attributes.totalHp;
            return true;
        }
        return false;
    }

    checkEndGame(listPlayers: Player[], server: Server) {
        listPlayers.forEach((player) => {
            if (player.victories >= 3) {
                server.emit('endGame', player);
            }
        });
    }

    getRandom(max: number) {
        return Math.floor(Math.random() * max + 1);
    }
}
