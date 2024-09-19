import { TestBed } from '@angular/core/testing';

import { GameAdminstrationService } from './game-adminstration.service';

describe('GameAdminstrationService', () => {
    let service: GameAdminstrationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameAdminstrationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('Should change the visibility of the game to true, when false', () => {
        const game = { visibility: false };
        service.gameVisibility(game);
        expect(game.visibility).toBeTrue();
    });

    it('Should change the visibility of the game to false, when true', () => {
        const game = { visibility: true };
        service.gameVisibility(game);
        expect(game.visibility).toBeFalsy();
    });
});
