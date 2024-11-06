import { ILogMessage } from '@app/interfaces/log.interface';
import { Player } from '@common/player';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class GameLogsService {
    logs = new Map<string, ILogMessage[]>();
    public lastLog = new Map<string, string>();

    createLog(players: Player[], message: string, roomId: string) {
        const date = new Date();
        const newLog = { message: message, timestamp: date, players: players };
        if (!this.logs.has(roomId)) {
            this.logs.set(roomId, []);
        }
        this.logs.get(roomId).push(newLog);
        return newLog;
    }

    getGameLog(roomId: string) {
        return this.logs.get(roomId);
    }

    // getFilterLogs(roomId: string, playerName: string) {
    //     return this.getGameLog(roomId).filter((log) => log.playersNames.includes(playerName));
    // }

    sendTurnLog(player: Player, roomId: string, server: Server) {
        const currentLog = this.lastLog.get(roomId);
        console.log('currentLog', currentLog);

        const message = this.generateTurnMessage(player);
        console.log('message', message);
        if (currentLog !== message) {
            this.lastLog.set(roomId, message);
            const log = this.createLog([player], message, roomId);
            server.to(roomId).emit('logReceived', log);
        }
    }

    generateTurnMessage(player: Player): string {
        return `Début du tour du joueur ${player.name}.`;
    }

    generateGiveUpGame(playerName: string): string {
        return `${playerName} a abandonné la partie.`;
    }
}
