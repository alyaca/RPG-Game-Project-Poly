import { TestBed } from '@angular/core/testing';
import { GameMode, MapSize, SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';

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
        service.setSelectedSize(MapSize.Small);
        expect(service.sizeSubject.getValue()).toEqual(MapSize.Small);
    });

    it('should select the right mode', () => {
        service.setSelectedMode(GameMode.Classic);
        expect(service.modeSubject.getValue()).toEqual(GameMode.Classic);
    });

    it('should update map dimensions when size is small', () => {
        service.setSelectedSize(MapSize.Small);
        expect(service.updateDimensions()).toEqual(SIZE_SMALL_MAP);
    });

    it('should update map dimensions when size is medium', () => {
        service.setSelectedSize(MapSize.Medium);
        expect(service.updateDimensions()).toEqual(SIZE_MEDIUM_MAP);
    });

    it('should update map dimensions when size is large', () => {
        service.setSelectedSize(MapSize.Large);
        expect(service.updateDimensions()).toEqual(SIZE_LARGE_MAP);
    });
});
