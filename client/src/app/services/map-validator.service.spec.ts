import { TestBed } from '@angular/core/testing';
import { MapValidatorService, TileType } from './map-validator.service';

describe('MapValidatorService', () => {
    let service: MapValidatorService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MapValidatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('hasSufficientTerrainTiles', () => {
        it('should return true if there are enough terrain tiles', () => {
            const map = [
                [TileType.Ground, TileType.Wall, TileType.Ground],
                [TileType.Ground, TileType.Wall, TileType.Water],
                [TileType.Ground, TileType.Ground, TileType.Ice],
            ];
            expect(service.hasSufficientTerrainTiles(map)).toBeTrue();
        });

        it('should return false if there are not enough terrain tiles', () => {
            const map = [
                [TileType.Wall, TileType.Wall],
                [TileType.Wall, TileType.Wall],
            ];
            expect(service.hasSufficientTerrainTiles(map)).toBeFalse();
        });
    });

    describe('validateAllDoors', () => {
        it('should return true if all doors are valid', () => {
            const map = [
                [TileType.Wall, TileType.Ground, TileType.Wall],
                [TileType.Wall, TileType.OpenDoor, TileType.Wall],
                [TileType.Wall, TileType.Water, TileType.Wall],
            ];
            expect(service.validateAllDoors(map)).toBeTrue();
        });

        it('should return false if any door is invalid', () => {
            const map = [
                [TileType.Wall, TileType.OpenDoor, TileType.Wall],
                [TileType.Wall, TileType.ClosedDoor, TileType.Wall],
                [TileType.Wall, TileType.Wall, TileType.Wall],
            ];
            expect(service.validateAllDoors(map)).toBeFalse();
        });
    });

    describe('isEveryTileAccessible', () => {
        it('should return true if every non-wall tile is accessible', () => {
            const map = [
                [TileType.Ground, TileType.Ground, TileType.Wall],
                [TileType.Ground, TileType.Ground, TileType.Ground],
                [TileType.Wall, TileType.Wall, TileType.Wall],
            ];
            expect(service.isEveryTileAccessible(map)).toBeTrue();
        });

        it('should return false if there are non-wall tiles that are inaccessible', () => {
            const map = [
                [TileType.Wall, TileType.Ground, TileType.Wall],
                [TileType.Wall, TileType.Wall, TileType.Wall],
                [TileType.Wall, TileType.Ground, TileType.Wall],
            ];
            expect(service.isEveryTileAccessible(map)).toBeFalse();
        });
    });

    describe('isDoorPlacementValid', () => {
        it('should return false for valid door placement', () => {
            const map = [
                [TileType.Wall, TileType.Wall, TileType.Wall],
                [TileType.Wall, TileType.OpenDoor, TileType.Wall],
                [TileType.Wall, TileType.Wall, TileType.Wall],
            ];
            expect(service.isDoorPlacementValid(map, 1, 1)).toBeFalsy();
        });

        it('should return false for invalid door placement', () => {
            const map = [
                [TileType.Wall, TileType.Wall, TileType.Wall],
                [TileType.Ground, TileType.OpenDoor, TileType.Wall],
                [TileType.Wall, TileType.Wall, TileType.Wall],
            ];
            expect(service.isDoorPlacementValid(map, 1, 1)).toBeFalse();
        });
    });
});
