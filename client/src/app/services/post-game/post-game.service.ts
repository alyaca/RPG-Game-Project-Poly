import { Injectable } from '@angular/core';
import { Player, Position } from '@common/player';
import { GlobalPostGameStats } from '@common/global-post-game-stats';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { GameMode, POST_GAME_STAT_TYPES, SortOrder, TileType, TOTAL_PERCENTAGE } from '@app/constants';
import { Room } from '@common/room';
import { PostGameStat } from '@common/post-game-stat';

@Injectable({
    providedIn: 'root',
})
export class PostGameService {
    gameRoom: Room;
    doorsInteractedPct: string;
    gameDuration: string;
    globalTilesVisitedPct: number;
    totalTerrainTiles: number = -1;
    totalDoors: number = -1;
    explanations: string = '';
    selectedAttribute: string = '';
    sortOrder: { [key: string]: SortOrder } = {
        combats: SortOrder.Unsorted,
        victories: SortOrder.Unsorted,
        evasions: SortOrder.Unsorted,
        defeats: SortOrder.Unsorted,
        dmgDealt: SortOrder.Unsorted,
        dmgTaken: SortOrder.Unsorted,
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
    isCTFMode: boolean;
    postGameStatTypes: PostGameStat[] = POST_GAME_STAT_TYPES;

    constructor(public navigationService: NavigationService) {}

    resetOtherAttributes(attribute: keyof Player['postGameStats']) {
        Object.keys(this.sortOrder).forEach((key) => {
            if (key !== attribute) {
                this.sortOrder[key] = SortOrder.Unsorted;
            }
        });
    }

    toggleSortOrder(attribute: keyof Player['postGameStats']) {
        if (this.sortOrder[attribute] === SortOrder.Unsorted || this.sortOrder[attribute] === SortOrder.Ascending) {
            this.sortOrder[attribute] = SortOrder.Descending;
        } else {
            this.sortOrder[attribute] = SortOrder.Ascending;
        }
    }

    performSorting(attribute: keyof Player['postGameStats']) {
        const isAscending = this.sortOrder[attribute] === SortOrder.Ascending;

        this.players.sort((a, b) => {
            const valA = a.postGameStats[attribute];
            const valB = b.postGameStats[attribute];

            if (valA > valB) return isAscending ? 1 : -1;
            if (valA < valB) return isAscending ? -1 : 1;
            return 0;
        });
    }

    sortPlayers(attribute: keyof Player['postGameStats']) {
        this.selectedAttribute = attribute;
        this.resetOtherAttributes(attribute);
        this.toggleSortOrder(attribute);
        this.performSorting(attribute);
    }

    updateExplanations(attr: keyof Player['postGameStats'] | '') {
        for (const attribute of this.postGameStatTypes) {
            if (attribute.key === attr) {
                this.explanations = attribute.explanations;
                return;
            }
        }
        this.explanations = '';
    }

    updateExplanationsGlobal(stat: keyof GlobalPostGameStats) {
        switch (stat) {
            case 'gameDuration':
                this.explanations = "Temps écoulé depuis le début de la partie jusqu'à la fin de la partie";
                break;
            case 'turns':
                this.explanations = 'Somme des tours de tous les joueurs de cette partie';
                break;
            case 'globalTilesVisited':
                this.explanations = 'Pourcentage des tuiles de terrain visitées par au moins un joueur';
                break;
            case 'doorsInteracted':
                this.explanations = 'Pourcentage des portes ayant été manipulées au moins une fois';
                break;
            case 'nbFlagBearers':
                this.explanations = 'Nombre de joueurs différents ayant détenu le drapeau (si applicable)';
                break;
            default:
                this.explanations = '';
        }
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

    calculateInteractionPct(elemList: Position[], maxElem: number): number {
        if (maxElem === 0) {
            return -1;
        }
        return Number(((elemList.length / maxElem) * TOTAL_PERCENTAGE).toFixed(2));
    }

    calculateDoorsInteracted(): number {
        return this.calculateInteractionPct(this.globalStats.doorsInteracted, this.findTotalDoors());
    }

    calculatePlayerTilesVisited() {
        for (const player of this.players) {
            player.postGameStats.tilesVisited = this.calculateInteractionPct(player.positionHistory, this.findTotalTerrainTiles());
        }
    }

    transferRoomStats(room: Room) {
        this.gameRoom = room;
        this.tilesGrid = room.gameMap.tiles;
        this.players = room.listPlayers;
        this.globalStats = room.globalPostGameStats;
        this.isCTFMode = room.gameMap.mode === GameMode.Ctf;

        for (const player of this.players) {
            const matchingPlayer = room.listPlayers.find((p) => p.id === player.id);
            if (matchingPlayer) {
                player.positionHistory = matchingPlayer.positionHistory;
            }
        }
    }

    computeStats() {
        this.calculatePlayerTilesVisited();
        this.computeDoorsInteractedPct();
        this.computeGlobalTilesVisitedPct();
    }

    computeGlobalTilesVisitedPct() {
        this.totalTerrainTiles = this.findTotalTerrainTiles();
        this.globalTilesVisitedPct = this.calculateInteractionPct(this.globalStats.globalTilesVisited, this.totalTerrainTiles);
    }

    computeDoorsInteractedPct() {
        this.totalDoors = this.findTotalDoors();
        this.doorsInteractedPct = this.calculateInteractionPct(this.globalStats.doorsInteracted, this.totalDoors).toString();
        if (this.doorsInteractedPct === '-1') {
            this.doorsInteractedPct = 'NA';
        } else {
            this.doorsInteractedPct += '%';
        }
    }
}
