import { Injectable } from '@angular/core';
import { SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameCreationService {
    sizeSubject = new BehaviorSubject<string | null>(null);
    modeSubject = new BehaviorSubject<string | null>(null);

    setSelectedSize(size: string) {
        this.sizeSubject.next(size);
    }

    setSelectedMode(mode: string) {
        this.modeSubject.next(mode);
    }

    getStoredSize(): string | null {
        return this.sizeSubject.value;
    }

    updateDimensions(): number | void {
        const size = this.getStoredSize();
        if (size === 'small') {
            return SIZE_SMALL_MAP;
        } else if (size === 'medium') {
            return SIZE_MEDIUM_MAP;
        } else if (size === 'large') {
            return SIZE_LARGE_MAP;
        }
    }
}
