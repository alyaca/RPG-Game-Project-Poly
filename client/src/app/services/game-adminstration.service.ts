import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class GameAdminstrationService {
    gameVisibility(game: { visibility: boolean }) {
        game.visibility = !game.visibility;
    }
}
