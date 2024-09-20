import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class GameCreationService {
    private sizeSubject = new BehaviorSubject<string | null>(null);

    selectedSize$ = this.sizeSubject.asObservable();

    setSelectedSize(size: string) {
        this.sizeSubject.next(size);
    }
}
