import { ILogMessage } from '@app/interfaces/log.interface';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class GameLogsService {
    logs = new Map<string, ILogMessage[]>();
    private lastLog = new Map<string, string>();

    createLog(playersNames: string[], message: string, roomId: string) {
        const date = new Date();
        const newLog = { message: message, timestamp: date, playersNames: playersNames };
        if (!this.logs.has(roomId)) {
            this.logs.set(roomId, []);
        }
        this.logs.get(roomId)?.push(newLog);
        return newLog;
    }

    getGameLog(roomId: string) {
        return this.logs.get(roomId);
    }

    getFilterLogs(roomId: string, playerName: string) {
        return this.getGameLog(roomId).filter((log) => log.playersNames.includes(playerName));
    }

    sendTurnLog(playerName: string, roomId: string, server: Server) {
        const currentLog = this.lastLog.get(roomId);

        const message = this.generateTurnMessage(playerName);
        if (currentLog !== message) {
            this.lastLog.set(roomId, message);
            const log = this.createLog([playerName], message, roomId);
            server.to(roomId).emit('logReceived', log);
        }
    }

    generateTurnMessage(playerName: string) {
        return `Début du tour du joueur ${playerName}.`;
    }

    generateGiveUpGame(playerName: string): string {
        return `${playerName} a abandonné la partie.`;
    }
}
