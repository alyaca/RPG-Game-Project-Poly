import { Injectable } from '@angular/core';
import { PLAYER_STAT_TYPES, SortOrder, TOTAL_PERCENTAGE } from '@app/constants';
import { GameMode, TileType } from '@common/constants';
import { GlobalPostGameStat, GlobalPostGameStats } from '@common/interfaces/global-post-game-stats';
import { Player, Position } from '@common/interfaces/player';
import { PlayerStatType, PostGameStat } from '@common/interfaces/post-game-stat';
import { Room } from '@common/interfaces/room';

@Injectable({
    providedIn: 'root',
})
export class PostGameService {
    gameRoom: Room;
    doorsInteractedPercentage: string;
    gameDuration: string;
    globalTilesVisitedPercentage: number;
    totalTerrainTiles: number = -1;
    totalDoors: number = -1;
    explanations: string = '';
    selectedAttribute: string = '';
    sortOrder: { [key: string]: SortOrder } = {
        combats: SortOrder.Unsorted,
        victories: SortOrder.Unsorted,
        evasions: SortOrder.Unsorted,
        defeats: SortOrder.Unsorted,
        damageDealt: SortOrder.Unsorted,
        damageTaken: SortOrder.Unsorted,
        itemsObtained: SortOrder.Unsorted,
        tilesVisited: SortOrder.Unsorted,
    };

    globalStats: GlobalPostGameStats = {
        gameDuration: '00:00',
        turns: 0,
        globalTilesVisited: [],
        doorsInteracted: [],
        nbFlagBearers: 0,
    };

    players: Player[];
    tilesGrid: number[][];
    isFlagMode: boolean;
    postGameStatTypes: PostGameStat[] = PLAYER_STAT_TYPES;

    resetOtherAttributes(attribute: keyof Player['postGameStats']) {
        Object.keys(this.sortOrder).forEach((key) => {
            if (key !== attribute) {
                this.sortOrder[key] = SortOrder.Unsorted;
            }
        });
    }

    toggleSortOrder(attribute: keyof Player['postGameStats']) {
        this.sortOrder[attribute] =
            this.sortOrder[attribute] === SortOrder.Unsorted || this.sortOrder[attribute] === SortOrder.Ascending
                ? SortOrder.Descending
                : SortOrder.Ascending;
    }

    performSorting(attribute: keyof Player['postGameStats']) {
        const isAscending = this.sortOrder[attribute] === SortOrder.Ascending;

        this.players.sort((frontElement, backElement) => {
            const frontValue = frontElement.postGameStats[attribute];
            const backValue = backElement.postGameStats[attribute];

            if (frontValue > backValue) return isAscending ? 1 : -1;
            if (frontValue < backValue) return isAscending ? -1 : 1;
            return 0;
        });
    }

    sortPlayers(attribute: keyof Player['postGameStats']) {
        this.selectedAttribute = attribute;
        this.resetOtherAttributes(attribute);
        this.toggleSortOrder(attribute);
        this.performSorting(attribute);
    }

    updateExplanations(selectedAttribute: keyof Player['postGameStats'] | '') {
        for (const attribute of this.postGameStatTypes) {
            if (attribute.key === selectedAttribute) {
                this.explanations = attribute.explanations;
                return;
            }
        }
        this.explanations = '';
    }

    updateExplanationsGlobal(stat: GlobalPostGameStat) {
        this.explanations = stat.explanations;
    }

    getMaxStat(statKey: keyof Player['postGameStats']): number {
        return Math.max(...this.players.map((player) => player.postGameStats[statKey]));
    }

    countTiles(condition: (tile: number) => boolean): number {
        let count = 0;
        for (const row of this.tilesGrid) {
            for (const tile of row) {
                if (condition(tile)) {
                    count++;
                }
            }
        }
        return count;
    }

    findTotalTerrainTiles(): number {
        return this.countTiles((tile) => tile < TileType.Wall);
    }

    findTotalDoors(): number {
        return this.countTiles((tile) => tile > TileType.Wall);
    }

    calculateInteractionPercentage(elementList: Position[], maxElement: number): number {
        if (maxElement === 0) {
            return -1;
        }
        return Number(((elementList.length / maxElement) * TOTAL_PERCENTAGE).toFixed(2));
    }

    calculateDoorsInteracted(): number {
        return this.calculateInteractionPercentage(this.globalStats.doorsInteracted, this.findTotalDoors());
    }

    calculatePlayerTilesVisited() {
        for (const player of this.players) {
            player.postGameStats.tilesVisited = this.calculateInteractionPercentage(player.positionHistory, this.findTotalTerrainTiles());
        }
    }

    transferRoomStats(room: Room) {
        this.gameRoom = room;
        this.tilesGrid = room.gameMap.tiles;
        this.players = room.listPlayers;
        this.globalStats = room.globalPostGameStats;
        this.isFlagMode = room.gameMap.mode === GameMode.CaptureTheFlag;

        for (const player of this.players) {
            const matchingPlayer = room.listPlayers.find((p) => p.id === player.id);
            if (matchingPlayer) {
                player.positionHistory = matchingPlayer.positionHistory;
            }
        }
    }

    computeStats() {
        this.calculatePlayerTilesVisited();
        this.computeDoorsInteractedPercentage();
        this.computeGlobalTilesVisitedPercentage();
    }

    computeGlobalTilesVisitedPercentage() {
        this.totalTerrainTiles = this.findTotalTerrainTiles();
        this.globalTilesVisitedPercentage = this.calculateInteractionPercentage(this.globalStats.globalTilesVisited, this.totalTerrainTiles);
    }

    computeDoorsInteractedPercentage() {
        this.totalDoors = this.findTotalDoors();
        this.doorsInteractedPercentage = this.calculateInteractionPercentage(this.globalStats.doorsInteracted, this.totalDoors).toString();
        if (this.doorsInteractedPercentage === '-1') {
            this.doorsInteractedPercentage = 'NA';
        } else {
            this.doorsInteractedPercentage += '%';
        }
    }

    isAttributeVictories(selectedAttribute: keyof Player['postGameStats']) {
        return selectedAttribute === PlayerStatType.Victories;
    }
}
