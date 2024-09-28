import { TestBed } from '@angular/core/testing';
import { TileService } from './tile.service';
import { TileType } from '@app/services/map-validator.service';

describe('TileService', () => {
    let service: TileService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(TileService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getTileImage', () => {
        it('should return the correct image path for each tile type', () => {
            expect(service.getTileImage(TileType.Ground)).toBe('/assets/images/tiles/grass.jpg');
            expect(service.getTileImage(TileType.Ice)).toBe('/assets/images/tiles/ice.jpg');
            expect(service.getTileImage(TileType.Wall)).toBe('/assets/images/tiles/wall.jpg');
            expect(service.getTileImage(TileType.Water)).toBe('/assets/images/tiles/water.jpg');
            expect(service.getTileImage(TileType.ClosedDoor)).toBe('/assets/images/tiles/closed-door.jpg');
            expect(service.getTileImage(TileType.OpenDoor)).toBe('/assets/images/tiles/open-door.jpg');
            expect(service.getTileImage(0)).toBe('');
        });
    });

    describe('setTile', () => {
        let array: number[][];

        beforeEach(() => {
            array = [
                [TileType.Ground, TileType.Ground],
                [TileType.Ground, TileType.Ground],
            ];
        });

        it('should set the tile to Ice when selectedTile is ice-tile', () => {
            service.setTile('ice-tile', 0, 0, array);
            expect(array[0][0]).toBe(TileType.Ice);
        });

        it('should set the tile to Wall when selectedTile is wall-tile', () => {
            service.setTile('wall-tile', 0, 1, array);
            expect(array[0][1]).toBe(TileType.Wall);
        });

        it('should set the tile to Water when selectedTile is water-tile', () => {
            service.setTile('water-tile', 1, 0, array);
            expect(array[1][0]).toBe(TileType.Water);
        });

        it('should toggle between OpenDoor and ClosedDoor for door-tile', () => {
            service.setTile('door-tile', 1, 1, array);
            expect(array[1][1]).toBe(TileType.ClosedDoor);

            service.setTile('door-tile', 1, 1, array);
            expect(array[1][1]).toBe(TileType.OpenDoor);

            service.setTile('door-tile', 1, 1, array);
            expect(array[1][1]).toBe(TileType.ClosedDoor);
        });

        it('should not change the array if selectedTile is invalid', () => {
            service.setTile('invalid-tile', 0, 0, array);
            expect(array[0][0]).toBe(TileType.Ground);
        });
    });

    describe('removeTile', () => {
        let array: number[][];
        let mockEvent: MouseEvent;

        beforeEach(() => {
            array = [
                [TileType.Wall, TileType.Water],
                [TileType.Ice, TileType.ClosedDoor],
            ];
            mockEvent = new MouseEvent('contextmenu', { cancelable: true });
        });

        it('should reset the tile to Ground if it is not Ground', () => {
            service.removeTile(mockEvent, 0, 0, array);
            expect(array[0][0]).toBe(TileType.Ground);

            service.removeTile(mockEvent, 1, 1, array);
            expect(array[1][1]).toBe(TileType.Ground);
        });

        it('should not change the tile if it is already Ground', () => {
            array[0][0] = TileType.Ground;
            service.removeTile(mockEvent, 0, 0, array);
            expect(array[0][0]).toBe(TileType.Ground);
        });
    });
});
