import { FIGHT_TIME } from '@app/constants';
import { RoomService } from '@app/services/room/room.service';
import { Player } from '@common/player';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@Injectable()
export class CombatService {
    constructor(private roomService: RoomService) {}

    onStartCombat(client: Socket, player1: Player, player2: Player, server: Server) {
        const room = this.roomService.getRoom(client);
        this.roomService.getTurnTimer(room.roomId).pauseTimer();
        this.roomService.getFightTimer(room.roomId).resetTimer(FIGHT_TIME, (timeRemaining) => {
            client.emit('combatTime', timeRemaining);
            server.to(player2.id).emit('combatTime', timeRemaining);
            if (timeRemaining <= 0) {
                client.emit('CombatTurnEnded');
                server.to(player2.id).emit('CombatTurnEnded');
            }
        });
        const data = { player1, player2 };
        client.emit('receivedCombat', data);
        server.to(player2.id).emit('receivedCombat', data);
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
}
