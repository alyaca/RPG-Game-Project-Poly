import { ILogMessage } from '@app/interfaces/log.interface';
import { Player } from '@common/player';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class GameLogsService {
    logs = new Map<string, ILogMessage[]>();
    lastLog = new Map<string, string>();

    createLog(players: Player[], message: string, roomId: string) {
        const date = new Date();
        const newLog = { message, timestamp: date, players };
        if (!this.logs.has(roomId)) {
            this.logs.set(roomId, []);
        }
        this.logs.get(roomId).push(newLog);
        return newLog;
    }

    getGameLog(roomId: string) {
        return this.logs.get(roomId);
    }

    sendTurnLog(player: Player, roomId: string, server: Server) {
        const currentLog = this.lastLog.get(roomId);
        const message = this.generateTurnMessage(player);
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

    sendDebugMessage(isDebugMode: boolean, roomId: string, server: Server)  {
        const currentLog = this.lastLog.get(roomId);
        const message = this.generateDebugMessage(isDebugMode);
        if (currentLog !== message) {
            this.lastLog.set(roomId, message);
            const log = this.createLog([], message, roomId);
            server.to(roomId).emit('logReceived', log);
        }
    }

    
    generateDebugMessage(isDebugMode: boolean): string {
        if (isDebugMode) {
            return "Début du mode débogage par l'administrateur";
        }
        return "Fin du mode débogage par l'administrateur";

    }
}
