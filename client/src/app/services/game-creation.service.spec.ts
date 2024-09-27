import { TestBed } from '@angular/core/testing';

import { GameCreationService } from '@app/services/game-creation.service';

describe('GameCreationService', () => {
    let service: GameCreationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameCreationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should select the right size', () => {
        service.setSelectedSize('size');
        expect(service.getSize()).toEqual('size');
    });

    it('should select the right mode', () => {
        service.setSelectedMode('mode');
        expect(service.getMode()).toEqual('mode');
    });

    it('should get the right size', () => {
        expect(service.getSize()).toEqual(service.getSize());
    });

    it('should get the right mode', () => {
        expect(service.getMode()).toEqual(service.getMode());
    });
});
