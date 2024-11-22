import { MAX_GENERATION_VALUE, TileType } from '@app/constants';
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

    private sendLog(roomId: string, server: Server, players: Player[], message: string) {
        const currentLog = this.lastLog.get(roomId);
        if (currentLog !== message) {
            this.lastLog.set(roomId, message);
            const log = this.createLog(players, message, roomId);
            server.to(roomId).emit('logReceived', log);
        }
    }

    private generateUniqueId(): number {
        return Math.floor(Math.random() * MAX_GENERATION_VALUE);
    }

    getGameLog(roomId: string) {
        return this.logs.get(roomId);
    }

    sendTurnLog(player: Player, roomId: string, server: Server) {
        const message = this.generateTurnMessage(player);
        this.sendLog(roomId, server, [player], message);
    }

    sendQuit(player: Player, roomId: string, server: Server) {
        const message = this.generateGiveUpGame(player.name);
        this.sendLog(roomId, server, [player], message);
    }

    sendDoorMessage(tile: TileType, player: Player, roomId: string, server: Server) {
        const message = tile === TileType.OpenDoor ? this.generateOpenDoorMessage(player.name) : this.generateCloseDoorMessage(player.name);
        this.sendLog(roomId, server, [player], message);
    }

    sendStartCombatLog(combatPlayers: CombatPlayers, roomId: string, server: Server) {
        const message = this.generateStartCombat(combatPlayers);
        this.sendLog(roomId, server, [combatPlayers.attacker, combatPlayers.defender], message);
    }

    sendWinCombatLog(player: Player, roomId: string, server: Server) {
        const message = this.generateWinCombat(player.name);
        this.sendLog(roomId, server, [player], message);
    }

    sendEvadeCombatLog(player: Player, roomId: string, server: Server) {
        const message = this.generateEvadeCombat(player.name);
        this.sendLog(roomId, server, [player], message);
    }

    sendDefaultWinCombatLog(winner: Player, roomId: string, server: Server) {
        const message = this.generateDefaultWin(winner.name);
        this.sendLog(roomId, server, [winner], message);
    }

    generateTurnMessage(player: Player): string {
        return `Début du tour du joueur ${player.name}.`;
    }

    generateGiveUpGame(playerName: string): string {
        return `${playerName} a abandonné la partie.`;
    }

    generateOpenDoorMessage(playerName: string): string {
        return `${playerName} a ouvert une porte.`;
    }

    generateCloseDoorMessage(playerName: string): string {
        return `${playerName} a fermé une porte.`;
    }

    generateStartCombat(combatPlayers: CombatPlayers): string {
        return `${combatPlayers.attacker.name} et ${combatPlayers.defender.name} sont entrés en combat.`;
    }

    generateWinCombat(playerName: string): string {
        return `${playerName} a gagné le combat. Le combat est terminé !`;
    }

    generateEvadeCombat(playerName: string): string {
        return `${playerName} s'est évadé. Le combat est terminé !`;
    }

    generateDefaultWin(winnerName: string) {
        return `${winnerName} a gagné le combat par défaut puisque l'opposant a quitté la partie.`;
    }
}
