import { Injectable } from '@angular/core';
import { COMBAT_TURN_LENGTH } from '@app/constants';
import { Player } from '@common/player';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CombatService {
    player1: Player;
    player2: Player;
    // timeRemaining: number;
    timeRemainingSubject = new BehaviorSubject<number>(COMBAT_TURN_LENGTH);
    timeRemaining$ = this.timeRemainingSubject.asObservable();

    initializeCombat(player1: Player, player2: Player) {
        this.player1 = player1;
        this.player2 = player2;
    }

    updateTimeRemaining(timeRemaining: number) {
        this.timeRemainingSubject.next(timeRemaining);
    }
}
