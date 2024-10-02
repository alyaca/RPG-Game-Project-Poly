import { TestBed } from '@angular/core/testing';
import { GameGridService } from './game-grid.service';
import { dummyMap } from '@app/mocks/mock-map';

describe('GameGridService', () => {
    let service: GameGridService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameGridService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have default values', () => {
        expect(service.hasMapToEditSubject).toBeFalse();
        expect(service.mapToEdit).toBeUndefined(); 
    });

    it('should set mapToEdit and update hasMapToEditSubject', () => {
        service.setMapToEdit(dummyMap);

        expect(service.mapToEdit).toEqual(dummyMap);
        expect(service.hasMapToEditSubject).toBeTrue();
    });
});
