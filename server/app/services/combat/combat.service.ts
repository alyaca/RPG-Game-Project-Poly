import { CombatInfo } from '@common/combat-info';
import { Player } from '@common/player';
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
        //const combatInfo = this.createCombatInfo(room.roomId, player1, player2);
        this.gameTime = this.roomService.getTurnTimer(room.roomId).getTimeRemaining();
        this.roomService.getTurnTimer(room.roomId).pauseTimer();
        server.emit('startFight', { player1, player2 });

        const callback = (timeRemaining: number) => {
            server.emit('combatTime', timeRemaining);
            if (timeRemaining <= 0) {
                if (this.activePlayer === player1) {
                    this.activePlayer = player2;
                    this.defensePlayer = player1;
                } else {
                    this.activePlayer = player1;
                    this.defensePlayer = player2;
                }
                server.emit('CombatTurnEnded', this.activePlayer);
                this.roomService.getFightTimer(room.roomId).resetTimer(5, callback);
            }
        };
        this.roomService.getFightTimer(room.roomId).resetTimer(5, callback);
    }

    attackPlayer(client: Socket, server: Server) {
        const attackValue = this.activePlayer.attributes.attack + this.getRandom(this.activePlayer.attributes.atkDiceMax);
        const defenseValue = this.defensePlayer.attributes.defense + this.getRandom(this.defensePlayer.attributes.defDiceMax);
        console.log('att : ' + attackValue, 'def : ' + defenseValue);
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
            //TODO : implementer dans le front
            server.emit('drawCombat');
        }
    }

    //Pas sure de la logique
    evadingPlayer(client: Socket, player: Player, server: Server) {
        if (this.isEvasionSuccessful) {
            server.emit('evasionSuccess', player);
        }
    }

    isEvasionSuccessful() {
        return 40 < this.getRandom(100); //Constant
    }

    checkIfPlayerIsDead(client: Socket, player1: Player, player2: Player, server: Server) {
        if (player1.attributes.currentHp <= 0) {
            const room = this.roomService.getRoom(client);
            player2.victories++;
            server.emit('playerDead', player1);
            setTimeout(() => {
                server.emit('combatEnd', player2);
            }, 2000);

            server.emit('combatEnd', player2);
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

    getRandom(max: number) {
        return Math.floor(Math.random() * max + 1); //Pas sur de +1
    }

    createCombatInfo(roomId: string, player1: Player, player2: Player) {
        const combatInfo: CombatInfo = {
            isPlayer1Damaged: false,
            isPlayer2Damaged: false,
            statValue1: 0,
            statValue2: 0,
            displayText: '',
            isGameOngoing: true,
            currPlayerNum: '',
            evasionsArray1: new Array(2).fill(1),
            evasionsArray2: new Array(2).fill(1),
            playerStat1: '',
            playerStat2: '',
            roles: {},
            isDraw: false,
            attackInProgress: false,
            player1: player1,
            player2: player2,
        };
    }
}
