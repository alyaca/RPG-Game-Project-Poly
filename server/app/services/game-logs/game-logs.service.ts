import { LogType, TileType } from '@app/constants';
import { ILogMessage } from '@app/interfaces/log.interface';
import { CombatPlayers } from '@common/combat-player';
import { Player, Status } from '@common/player';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class GameLogsService {
    logs = new Map<string, ILogMessage[]>();
    lastLog = new Map<string, string>();

    sendDebugLog(isDebugMode: boolean, roomId: string, server: Server) {
        const message = this.generateDebugMessage(isDebugMode);
        this.sendLog(roomId, server, [], message);
    }

    sendDoorLog(tile: TileType, player: Player, roomId: string, server: Server) {
        const message =
            tile === TileType.OpenDoor
                ? this.generatePlayerLogMessage(LogType.OpenDoor, player.name)
                : this.generatePlayerLogMessage(LogType.CloseDoor, player.name);
        this.sendLog(roomId, server, [player], message);
    }

    sendEndGameLog(players: Player[], roomId: string, server: Server) {
        const message = this.generateEndGameMessage(players);
        this.sendLog(roomId, server, players, message);
    }

    sendStartCombatLog(combatPlayers: CombatPlayers, roomId: string, server: Server) {
        const message = this.generateStartCombatMessage(combatPlayers);
        this.sendLog(roomId, server, [combatPlayers.attacker, combatPlayers.defender], message);
    }

    sendPlayerLog(roomId: string, server: Server, player: Player, logType: LogType): void {
        const message = this.generatePlayerLogMessage(logType, player.name);
        this.sendLog(roomId, server, [player], message);
    }

    private createLog(players: Player[], message: string, roomId: string) {
        const date = new Date();
        const newLog = { message, timestamp: date, players };
        if (!this.logs.has(roomId)) {
            this.logs.set(roomId, []);
        }
        this.logs.get(roomId).push(newLog);
        return newLog;
    }

    private generateDebugMessage(isDebugMode: boolean): string {
        return isDebugMode ? 'Début du mode débogage.' : 'Fin du mode débogage.';
    }

    private generateEndGameMessage(players: Player[]): string {
        const activePlayerNames = players.filter((player) => player.status !== Status.Disconnected).map((player) => player.name);
        return `Fin de partie : ${activePlayerNames.join(', ')}`;
    }

    private generatePlayerLogMessage(logType: LogType, playerName: string): string {
        switch (logType) {
            case LogType.StartTurn:
                return `Début du tour du joueur ${playerName}.`;
            case LogType.GiveUp:
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

    private sendLog(roomId: string, server: Server, players: Player[], message: string) {
        const currentLog = this.lastLog.get(roomId);
        if (currentLog !== message) {
            this.lastLog.set(roomId, message);
            const log = this.createLog(players, message, roomId);
            server.to(roomId).emit('logReceived', log);
        }
    }
}
