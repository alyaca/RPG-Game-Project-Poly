import { TestBed } from '@angular/core/testing';
import { FELLING_PROBABILITY, ObjectType } from '@app/constants';
import { mockGameNavigation as mockGame, mockGameNavigation } from '@app/mocks/mock-map';
import { playerNavigation as player, playerNavigation } from '@app/mocks/mock-player';
import { Position } from '@common/player';
import { NavigationService } from './navigation.service';

describe('NavigationServiceService', () => {
    let service: NavigationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(NavigationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should find the fastest path between two tiles ', () => {
        const path = service.findFastestPath(player, { x: 2, y: 0 }, mockGame);
        expect(path).toEqual([
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
        ]);
    });
    it('should find the reachable tiles ', () => {
        const reachableTiles = service.findReachableTiles(player, mockGame, 2);
        expect(reachableTiles).toEqual([
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 2, y: 1 },
            { x: 2, y: 2 },
            { x: 1, y: 1 },
            { x: 0, y: 1 },
        ]);
    });

    it('should return true if the tile is reachable ', () => {
        service.findReachableTiles(player, mockGame, 2);
        expect(service.isReachableTile(0, 0)).toBeTruthy();
    });

    it('should initialize gameMap and playsers ', () => {
        service.initialize(mockGame, [player]);
        expect(service.gameMap).toEqual(mockGame);
        expect(service.players).toEqual([player]);
    });

    it('should return the position of the players ', () => {
        service.players = [player];
        expect(service.placePlayers()).toEqual([{ x: 0, y: 0 }]);
    });

    it('should return false if the position is not within the bounds ', () => {
        expect(service.isPositionWithinBounds(0, 0, mockGame.tiles)).toBeTrue();
    });

    it('should return the correct ObjectType for known god names', () => {
        expect(service.getPortraitId('Hestia')).toBe(ObjectType.Hestia);
    });

    it('should return the path excluding the first position if the destination is reachable', () => {
        service.initialize(mockGameNavigation, [playerNavigation]);
        const destination: Position = { x: 2, y: 2 };
        spyOn(service, 'isReachableTile').and.returnValue(true);
        spyOn(service, 'findFastestPath').and.returnValue([
            { x: 0, y: 0 },
            { x: 1, y: 1 },
            { x: 2, y: 2 },
        ]);
        const path = service.navigateToTile(playerNavigation, destination, mockGameNavigation);

        expect(service.isReachableTile).toHaveBeenCalledWith(destination.x, destination.y);
        expect(service.findFastestPath).toHaveBeenCalledWith(playerNavigation, destination, mockGameNavigation);
        expect(path).toEqual([
            { x: 1, y: 1 },
            { x: 2, y: 2 },
        ]);
    });

    it('should return false if Math.random returns a value less than or equal to 0.1', () => {
        spyOn(Math, 'random').and.returnValue(FELLING_PROBABILITY);
        const result = service.checkFell();
        expect(result).toBeFalse();
    });
});
