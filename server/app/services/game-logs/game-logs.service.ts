import { LogType, TileType } from '@app/constants';
import { ILogMessage } from '@app/interfaces/log.interface';
import { CombatPlayers } from '@common/combat-player';
import { gameObjects } from '@common/objects-info';
import { Player, Status } from '@common/player';
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
@Injectable()
export class GameLogsService {
    logs = new Map<string, ILogMessage[]>();
    lastLog = new Map<string, string>();

    private sendLog(roomId: string, server: Server, players: Player[], message: string) {
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

    sendGlobalCombatLog(roomId: string, server: Server, combatPlayers: CombatPlayers, logType: LogType): void {
        const { attacker, defender } = combatPlayers;
        const message = this.generatePlayerLogMessage(logType, attacker.name, defender.name);
        this.sendLog(roomId, server, [attacker, defender], message);
    }

    sendPlayerLog(roomId: string, server: Server, player: Player, logType: LogType) {
        const message = this.generatePlayerLogMessage(logType, player.name);
        this.sendLog(roomId, server, [player], message);
    }

    sendCombatActionLog(roomId: string, server: Server, combatPlayers: CombatPlayers, logType: LogType) {
        const message = this.generatePlayerLogMessage(logType, combatPlayers.attacker.name);
        this.sendLogToCombatPlayers(roomId, server, combatPlayers, message);
    }

    sendCombatCombatResultLog(roomId: string, server: Server, combatPlayers: CombatPlayers) {
        const message = this.generateCombatResultMessage(combatPlayers);
        this.sendLogToCombatPlayers(roomId, server, combatPlayers, message);
    }

    sendItemLog(player: Player, roomId: string, server: Server, itemPickedUp: number) {
        const message = this.generateItemPickupMessage(player, itemPickedUp);
        this.sendLog(roomId, server, [player], message);
    }

    generateItemPickupMessage(player: Player, item: number) {
        const fullItem = gameObjects.find((object) => object.id === item);
        return `${player.name} a ramassé ${fullItem.name}`;
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

    private generateCombatResultMessage(combatPlayers: CombatPlayers): string {
        const { attacker, defender, combatResultDetails } = combatPlayers;
        const { attackValues, defenseValues } = combatResultDetails;
        return (
            `Résultat de l'attaque : ${attacker.attributes.attack} + ${attackValues.diceValue} (dé) = ${attackValues.total}\n` +
            `Résultat de la défense :  ${defender.attributes.attack} + ${defenseValues.diceValue} (dé) = ${defenseValues.total}`
        );
    }

    private generateDebugMessage(isDebugMode: boolean): string {
        return isDebugMode ? 'Début du mode débogage.' : 'Fin du mode débogage.';
    }

    private generateEndGameMessage(players: Player[]): string {
        const activePlayerNames = players.filter((player) => player.status !== Status.Disconnected).map((player) => player.name);
        return `Fin de partie : ${activePlayerNames.join(', ')}`;
    }

    private generatePlayerLogMessage(logType: LogType, playerName: string, defenderName?: string): string {
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
            case LogType.EvadeCombatFail:
                return `${playerName} a échoué son évasion.`;
            case LogType.EvadeCombatSuccess:
                return `${playerName} s'est évadé avec succès.`;
            case LogType.NoWinnerCombat:
                return `Combat termniné sans gagnant entre ${playerName} et ${defenderName}.`;
            case LogType.StartCombat:
                return `${playerName} et ${defenderName} sont entrés en combat.`;
            case LogType.AttackFail:
                return `${playerName} a échoué son attaque.`;
            case LogType.AttackSuccess:
                return `${playerName} a réussi son attaque.`;
            default:
                return 'Message de log inconnu.';
        }
    }

    private sendLog(roomId: string, server: Server, players: Player[], message: string) {
        const currentLog = this.lastLog.get(roomId);
        if (currentLog !== message) {
            this.lastLog.set(roomId, message);
            const log = this.createLog(players, message, roomId);
            server.to(roomId).emit('logReceived', log);
        }
    }

    private sendLogToCombatPlayers(roomId: string, server: Server, players: CombatPlayers, message: string) {
        const log = this.createLog([players.attacker, players.defender], message, roomId);
        server.to(players.attacker.id).emit('logReceived', log);
        server.to(players.defender.id).emit('logReceived', log);
    }
}
