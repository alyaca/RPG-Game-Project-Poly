import { FIGHT_TIME } from '@app/constants';
import { RoomService } from '@app/services/room/room.service';
import { CombatInfo } from '@common/combat-info';
import { Player } from '@common/player';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class CombatService {
    constructor(private roomService: RoomService) {}
    combatInfos = new Map<string, CombatInfo>();

    onStartCombat(client: Socket, player1: Player, player2: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        const combatInfo = this.createCombatInfo(room.roomId, player1, player2);
        this.roomService.getTurnTimer(room.roomId).pauseTimer();
        this.roomService.getFightTimer(room.roomId).resetTimer(FIGHT_TIME, (timeRemaining) => {
            client.emit('combatTime', timeRemaining);
            server.to(player2.id).emit('combatTime', timeRemaining);
            if (timeRemaining <= 0) {
                const CombatInfo = this.combatInfos.get(room.roomId);
                client.emit('CombatTurnEnded');
                server.to(player2.id).emit('CombatTurnEnded');
            }
        });
        client.emit('receivedCombat', combatInfo);
        server.to(player2.id).emit('receivedCombat', combatInfo);
    }

    combatTime(client: Socket, server: Server, player1: Player, player2: Player) {
        const room = this.roomService.getRoom(client);
        this.roomService.getFightTimer(room.roomId).resetTimer(FIGHT_TIME, (timeRemaining) => {
            client.emit('combatTime', timeRemaining);
            server.to(room.roomId).emit('combatTime', timeRemaining);
            if (timeRemaining <= 0) {
                client.emit('CombatTurnEnded');
                server.to(room.roomId).emit('CombatTurnEnded');
            }
        });
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
        this.combatInfos.set(roomId, combatInfo);
        return combatInfo;
    }

    setCombatInfo(roomId: string, combatInfo: CombatInfo) {
        this.combatInfos.set(roomId, combatInfo);
    }

    switchTurn(roomId: string) {
        let combatInfo = this.combatInfos.get(roomId);
        combatInfo.currPlayerNum = combatInfo.currPlayerNum === 'player1turn' ? 'player2turn' : 'player1turn';
        this.combatInfos.set(roomId, combatInfo);
    }
}
