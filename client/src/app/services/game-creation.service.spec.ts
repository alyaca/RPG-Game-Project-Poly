import { TestBed } from '@angular/core/testing';
import { SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
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
        service.setSelectedSize('small');
        expect(service.sizeSubject.getValue()).toEqual('small');
    });

    it('should get the stored size', () => {
        localStorage.setItem('selectedMapSize', 'small');
        expect(service.getStoredSize()).toEqual('small');
    });

    it('should select the right mode', () => {
        service.setSelectedMode('classic');
        expect(service.modeSubject.getValue()).toEqual('classic');
    });

    it('should update map dimensions when size is small', () => {
        service.setSelectedSize('small');
        expect(service.updateDimensions()).toEqual(SIZE_SMALL_MAP);
    });

    it('should update map dimensions when size is medium', () => {
        service.setSelectedSize('medium');
        expect(service.updateDimensions()).toEqual(SIZE_MEDIUM_MAP);
    });

    it('should update map dimensions when size is large', () => {
        service.setSelectedSize('large');
        expect(service.updateDimensions()).toEqual(SIZE_LARGE_MAP);
    });
});
