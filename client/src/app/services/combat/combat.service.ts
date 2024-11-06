import { Injectable } from '@angular/core';
import { Player } from '@common/player';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CombatService {
    player1: Player;
    player2: Player;
    //timeRemaining: number;
    private timeRemainingSubject = new BehaviorSubject<number>(5);
    timeRemaining$ = this.timeRemainingSubject.asObservable();
    constructor() {}

    initializeCombat(player1: Player, player2: Player) {
        this.player1 = player1;
        this.player2 = player2;
    }

    updateTimeRemaining(timeRemaining: number) {
        this.timeRemainingSubject.next(timeRemaining);
    }
}
