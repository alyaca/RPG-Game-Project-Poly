import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameCreationService {
    sizeSubject = new BehaviorSubject<string | null>(null);
    modeSubject = new BehaviorSubject<string | null>(null);

    selectedSize$ = this.sizeSubject.asObservable();

    setSelectedSize(size: string) {
        this.sizeSubject.next(size);
    }

    setSelectedMode(mode: string) {
        this.modeSubject.next(mode);
    }

    getSize() {
        return this.sizeSubject.value;
    }

    getMode() {
        return this.modeSubject.value;
    }
}
