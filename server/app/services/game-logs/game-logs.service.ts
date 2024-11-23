import { LogType, MAX_GENERATION_VALUE, TileType } from '@app/constants';
import { ILogMessage } from '@app/interfaces/log.interface';
import { CombatPlayers } from '@common/combat-player';
import { Player } from '@common/player';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class GameLogsService {
    logs = new Map<string, ILogMessage[]>();
    lastLog = new Map<string, string>();

    createLog(players: Player[], message: string, roomId: string) {
        const date = new Date();
        const newLog = { id: this.generateUniqueId(), message, timestamp: date, players };
        if (!this.logs.has(roomId)) {
            this.logs.set(roomId, []);
        }
        this.logs.get(roomId).push(newLog);
        return newLog;
    }

    sendDoorMessage(tile: TileType, player: Player, roomId: string, server: Server) {
        const message =
            tile === TileType.OpenDoor
                ? this.generatePlayerLogMessage(LogType.OpenDoor, player.name)
                : this.generatePlayerLogMessage(LogType.CloseDoor, player.name);
        this.sendLog(roomId, server, [player], message);
    }

    sendLog(roomId: string, server: Server, players: Player[], message: string) {
        const currentLog = this.lastLog.get(roomId);
        if (currentLog !== message) {
            this.lastLog.set(roomId, message);
            const log = this.createLog(players, message, roomId);
            server.to(roomId).emit('logReceived', log);
        }
    }

    sendDebugLog(isDebugMode: boolean, roomId: string, server: Server) {
        const message = this.generateDebugMessage(isDebugMode);
        this.sendLog(roomId, server, [], message);
    }

    sendStartCombatLog(combatPlayers: CombatPlayers, roomId: string, server: Server) {
        const message = this.generateStartCombatMessage(combatPlayers);
        this.sendLog(roomId, server, [combatPlayers.attacker, combatPlayers.defender], message);
    }

    sendPlayerLog(roomId: string, server: Server, player: Player, logType: LogType): void {
        const message = this.generatePlayerLogMessage(logType, player.name);
        this.sendLog(roomId, server, [player], message);
    }

    private generateDebugMessage(isDebugMode: boolean): string {
        return isDebugMode ? 'Début du mode débogage.' : 'Fin du mode débogage.';
    }

    private generatePlayerLogMessage(logType: LogType, playerName: string): string {
        switch (logType) {
            case LogType.StartTurn:
                return `Début du tour du joueur ${playerName}.`;
            case LogType.GiveUP:
                return `${playerName} a abandonné la partie.`;
            case LogType.OpenDoor:
                return `${playerName} a ouvert une porte.`;
            case LogType.CloseDoor:
                return `${playerName} a fermé une porte.`;
            case LogType.WinCombat:
                return `${playerName} a gagné le combat. Le combat est terminé !`;
            case LogType.EvadeCombat:
                return `${playerName} s'est évadé. Le combat est terminé !`;
            case LogType.DefaultWinCombat:
                return `${playerName} a gagné le combat par défaut puisque l'opposant a quitté la partie.`;
            default:
                return 'Message de log inconnu.';
        }
    }

    private generateStartCombatMessage(combatPlayers: CombatPlayers): string {
        return `${combatPlayers.attacker.name} et ${combatPlayers.defender.name} sont entrés en combat.`;
    }

    private generateUniqueId(): number {
        return Math.floor(Math.random() * MAX_GENERATION_VALUE);
    }
}
