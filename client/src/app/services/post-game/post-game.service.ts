import { Injectable } from '@angular/core';
import { Player, Position } from '@common/player';
import { GlobalPostGameStats } from '@common/global-post-game-stats';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { GameMode, TileType, TOTAL_PERCENTAGE } from '@app/constants';
import { Room } from '@common/room';

export interface Attribute {
    id: number;
    key: keyof Player['postGameStats'];
    displayTxt: string;
    explanations: string;
}

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
    sortOrder: { [key: string]: 'ascending' | 'descending' | 'unsorted' } = {
        combats: 'unsorted',
        victories: 'unsorted',
        evasions: 'unsorted',
        defeats: 'unsorted',
        dmgDealt: 'unsorted',
        dmgTaken: 'unsorted',
        itemsObtained: 'unsorted',
        tilesVisited: 'unsorted',
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

    attributes: Attribute[] = [
        {
            id: 0,
            key: 'combats',
            displayTxt: 'Combats',
            explanations: 'Nombre de combats participés par le joueur',
        },
        {
            id: 1,
            key: 'victories',
            displayTxt: 'W/D/L',
            explanations: 'Résultats des combats du joueur sous la forme victoires/évasions/défaites',
        },
        {
            id: 2,
            key: 'dmgDealt',
            displayTxt: 'Dég. infligés',
            explanations: 'Nombre de points de dégats infligés sur les joueurs adverses',
        },
        {
            id: 3,
            key: 'dmgTaken',
            displayTxt: 'Dégats subis',
            explanations: 'Nombre de points de dégats subis pas le joueur',
        },
        {
            id: 4,
            key: 'itemsObtained',
            displayTxt: 'Obj. récup.',
            explanations: "Nombre d'objets distincts ramassés par le joueur au cours de la partie",
        },
        {
            id: 5,
            key: 'tilesVisited',
            displayTxt: '%tuiles visités',
            explanations: 'Pourcentage des tuiles de terrain visités par le joueur',
        },
    ];

    constructor(public navigationService: NavigationService) {}

    resetOtherAttributes(attribute: keyof Player['postGameStats']) {
        Object.keys(this.sortOrder).forEach((key) => {
            if (key !== attribute) {
                this.sortOrder[key] = 'unsorted';
            }
        });
    }

    toggleSortOrder(attribute: keyof Player['postGameStats']) {
        if (this.sortOrder[attribute] === 'unsorted' || this.sortOrder[attribute] === 'ascending') {
            this.sortOrder[attribute] = 'descending';
        } else {
            this.sortOrder[attribute] = 'ascending';
        }
    }

    performSorting(attribute: keyof Player['postGameStats']) {
        const isAscending = this.sortOrder[attribute] === 'ascending';

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
        for (const attribute of this.attributes) {
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
