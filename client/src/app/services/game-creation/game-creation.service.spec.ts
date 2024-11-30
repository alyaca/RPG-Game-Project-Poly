import { TestBed } from '@angular/core/testing';
import { SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { mockGames } from '@app/mocks/mock-game';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { MapSize } from '@common/constants';
import { Game } from '@common/interfaces/game';

describe('GameCreationService', () => {
    let service: GameCreationService;
    let game: Game;
    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameCreationService);
        game = mockGames[0];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('deepCopyMatrix', () => {
        it('should return a deep copy of the matrix', () => {
            const matrix = [
                [1, 2],
                [2, 0],
            ];
            const result = service.deepCopyMatrix(matrix);
            expect(result).toEqual(matrix);
            expect(result).not.toBe(matrix);
        });

        it('should return an empty array if matrix is undefined', () => {
            const result = service.deepCopyMatrix(null);
            expect(result).toEqual([]);
        });
    });

    it('should select the right size', () => {
        service.setSelectedSize(MapSize.Small);
        expect(service.sizeSubject.getValue()).toEqual(MapSize.Small);
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

    it('should return "Small" for SIZE_SMALL_MAP', () => {
        game.dimension = SIZE_SMALL_MAP;
        const result = service.convertMapDimension(game);
        expect(result).toBe(MapSize.Small);
    });

    it('should return "Medium" for SIZE_MEDIUM_MAP', () => {
        game.dimension = SIZE_MEDIUM_MAP;
        const result = service.convertMapDimension(game);
        expect(result).toBe(MapSize.Medium);
    });

    it('should return "Large" for SIZE_LARGE_MAP', () => {
        game.dimension = SIZE_LARGE_MAP;
        const result = service.convertMapDimension(game);
        expect(result).toBe(MapSize.Large);
    });

    it('should return "none" for unknown dimensions', () => {
        game.dimension = -1;
        const result = service.convertMapDimension(game);
        expect(result).toBe('none');
    });
});
