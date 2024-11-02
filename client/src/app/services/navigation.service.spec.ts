import { TestBed } from '@angular/core/testing';
import { mockGameNavigation as mockGame } from '@app/mocks/mock-map';
import { playerNavigation as player } from '@app/mocks/mock-player';
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
});
