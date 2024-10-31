import { TestBed } from '@angular/core/testing';
import { SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation.service';
import { Game } from '@common/game';

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

    it('should return "small" if the game dimension is 10', () => {
        const mockGame = { dimension: 10 } as Game;
        const result = service.convertMapDimension(mockGame);
        expect(result).toBe('small');
    });

    it('should return "medium" if the game dimension is 15', () => {
        const mockGame = { dimension: 15 } as Game;
        const result = service.convertMapDimension(mockGame);
        expect(result).toBe('medium');
    });

    it('should return "large" if the game dimension is 20', () => {
        const mockGame = { dimension: 20 } as Game;
        const result = service.convertMapDimension(mockGame);
        expect(result).toBe('large');
    });

    it('should return "none" if the game dimension is not 10, 15, or 20', () => {
        const mockGame = { dimension: 25 } as Game;
        const result = service.convertMapDimension(mockGame);
        expect(result).toBe('none');
    });
});
