import { Injectable } from '@angular/core';
import { MapSize, SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { Game } from '@common/game';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameCreationService {
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

    getGameMode(): string {
        console.log(this.gameMode);
        return this.gameMode;
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
