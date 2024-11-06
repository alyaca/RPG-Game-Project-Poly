import { TestBed } from '@angular/core/testing';
import { mockPlayers } from '@app/mocks/mock-players';
import { gameObjects } from '@app/objects-info';
import { GameTileInfoService } from '@app/services/game-tile-info/game-tile-info.service';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { TileService } from '@app/services/tile/tile.service';
import { GameTile } from '@common/game-tile';

describe('GameTileInfoService', () => {
    let service: GameTileInfoService;
    let tileServiceSpy: jasmine.SpyObj<TileService>;
    let navigationServiceSpy: jasmine.SpyObj<NavigationService>;

    beforeEach(() => {
        tileServiceSpy = jasmine.createSpyObj('TileService', ['getTileImage']);
        navigationServiceSpy = jasmine.createSpyObj('NavigationService', ['players']);
        TestBed.configureTestingModule({
            providers: [
                GameTileInfoService,
                { provide: TileService, useValue: tileServiceSpy },
                { provide: NavigationService, useValue: navigationServiceSpy },
            ],
        });

        service = TestBed.inject(GameTileInfoService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getItem', () => {
        it('should return null if itemId is 0', () => {
            service.itemId = 0;
            expect(service.getItem()).toBeNull();
        });

        it('should return the correct game object if itemId is greater than 0', () => {
            service.itemId = 1;
            expect(service.getItem()).toEqual(gameObjects[0]);
        });

        it('should return undefined if itemId exceeds gameObjects array length', () => {
            service.itemId = gameObjects.length + 1;
            expect(service.getItem()).toBeUndefined();
        });
    });

    describe('getTile', () => {
        it('should return a valid game tile with the correct name, description, and image', () => {
            const tileId = 1;
            service.tileId = tileId;
            tileServiceSpy.getTileImage.and.returnValue('image-path');

            const result: GameTile = service.getTile();

            expect(result.id).toBe(tileId);
            expect(result.name).toBe(service.tileNames[tileId - 1]);
            expect(result.description).toBe(service.tileDescriptions[tileId - 1]);
            expect(result.image).toBe('image-path');
            expect(tileServiceSpy.getTileImage).toHaveBeenCalledWith(tileId);
        });
    });

    describe('getPlayer', () => {
        it('should return null if no player is on the selected tile', () => {
            navigationServiceSpy.players = mockPlayers;
            service.selectedRow = 2;
            service.selectedCol = 2;
            expect(service.getPlayer()).toBeNull();
        });

        it('should return the player if one is on the selected tile', () => {
            const mockPlayer = mockPlayers[0];

            navigationServiceSpy.players = mockPlayers;

            service.selectedRow = 0;
            service.selectedCol = 0;
            mockPlayers[0].position.x = 0;
            mockPlayers[0].position.y = 0;
            expect(service.getPlayer()).toEqual(mockPlayer);
        });

        it('should return null if player positions do not match selectedRow and selectedCol', () => {
            navigationServiceSpy.players = mockPlayers;

            service.selectedRow = 2;
            service.selectedCol = 2;
            expect(service.getPlayer()).toBeNull();
        });
    });
});
