import { Injectable } from '@angular/core';
import { SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { MapSize, TileType } from '@common/constants';
import { Game } from '@common/interfaces/game';
import { Position } from '@common/interfaces/position';
import { ClientToServerEvent } from '@common/socket.events';
import { BehaviorSubject } from 'rxjs';
import { GameTileInfoService } from '../game-tile-info/game-tile-info.service';

@Injectable({
    providedIn: 'root',
})
export class GameCreationService {
    constructor(
        private socketCommunicationService: SocketCommunicationService,
        private navigationService: NavigationService,
        private gameTileInfoService: GameTileInfoService,
    ) {}
    sizeSubject = new BehaviorSubject<string | null>(null);

    isNewGame: boolean = true;
    isModifiable: boolean = true;
    loadedTiles: number[][] = [];
    loadedObjects: number[][] = [];
    loadedMapName: string = '';
    loadedMapDescription: string = '';
    gameMode: string = '';

    setSelectedSize(size: string) {
        this.sizeSubject.next(size);
    }

    setSelectedMode(mode: string) {
        this.gameMode = mode;
    }

    getStoredSize(): string | null {
        return this.sizeSubject.value;
    }

    updateDimensions(): number | void {
        const size = this.getStoredSize();
        if (size === MapSize.Small) {
            return SIZE_SMALL_MAP;
        } else if (size === MapSize.Medium) {
            return SIZE_MEDIUM_MAP;
        } else if (size === MapSize.Large) {
            return SIZE_LARGE_MAP;
        }
    }

    resetGrid(mapSize: number, array: number[][]): number[][] {
        if (!this.isNewGame) {
            return this.loadedTiles;
        }
        array = Array.from({ length: mapSize }, () => Array(mapSize).fill(TileType.Ground));
        return array;
    }

    canTeleport(isMoving: boolean, isActive: boolean) {
        return this.navigationService.isDebugMode && !this.isModifiable && !isMoving && isActive;
    }

    rightClick(position: Position, isMoving: boolean, isActive: boolean) {
        const isMovingAndTileInfoVisible = [];
        if (this.canTeleport(isMoving, isActive)) {
            this.socketCommunicationService.send(ClientToServerEvent.TeleportPlayer, position);
        } else {
            isMovingAndTileInfoVisible[1] = this.showDetails(position);
        }
        isMovingAndTileInfoVisible[0] = false;
        return isMovingAndTileInfoVisible;
    }

    showDetails(position: Position) {
        if (!this.isModifiable) {
            this.socketCommunicationService.send(ClientToServerEvent.GetRoom);
            this.gameTileInfoService.selectedRow = position.x;
            this.gameTileInfoService.selectedCol = position.y;
            return true;
        }
        return false;
    }

    deepCopyMatrix(matrix: number[][] | null) {
        return matrix ? JSON.parse(JSON.stringify(matrix)) : [];
    }

    loadExistingTiles() {
        return this.deepCopyMatrix(this.loadedTiles);
    }

    loadExistingObjects() {
        return this.deepCopyMatrix(this.loadedObjects);
    }

    convertMapDimension(game: Game): string {
        if (game.dimension === SIZE_SMALL_MAP) {
            return MapSize.Small;
        } else if (game.dimension === SIZE_MEDIUM_MAP) {
            return MapSize.Medium;
        } else if (game.dimension === SIZE_LARGE_MAP) {
            return MapSize.Large;
        } else {
            return 'none';
        }
    }
}
