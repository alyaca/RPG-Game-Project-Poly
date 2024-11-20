import { TestBed } from '@angular/core/testing';

import { GameImportValidatorService } from './game-import-validator.service';

describe('GameImportValidatorService', () => {
    let service: GameImportValidatorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameImportValidatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
