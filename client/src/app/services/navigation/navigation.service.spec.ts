import { TestBed } from '@angular/core/testing';
import { ObjectType, SIZE_SMALL_MAP } from '@app/constants';
import { mockMediumItemsMatrice, mockObjectsMatrice } from '@app/mocks/mock-game';
import { mockGameNavigation as mockGame } from '@app/mocks/mock-map';
import { playerNavigation as player, playerNavigation } from '@app/mocks/mock-player';
import { mockPlayers } from '@app/mocks/mock-players';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { NavigationService } from './navigation.service';
/* eslint-disable  @typescript-eslint/no-explicit-any */

describe('NavigationServiceService', () => {
    let service: NavigationService;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;

    beforeEach(() => {
        socketCommunicationServiceSpy = jasmine.createSpyObj(SocketCommunicationService, ['send', 'emit']);
        TestBed.configureTestingModule({
            providers: [{ provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy }],
        });
        service = TestBed.inject(NavigationService);
        service.initialize(mockGame, [player], mockGame.tiles);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set the objects', () => {
        service.updateObjects(mockMediumItemsMatrice);
        expect(service.objects).toEqual(JSON.parse(JSON.stringify(mockMediumItemsMatrice)));
    });

    it('should update the tile to spawn', () => {
        spyOn(service, 'isInInitialPosition').and.returnValue(true);
        service.updateTile(playerNavigation);
        expect(service.positions[playerNavigation.position.x][playerNavigation.position.y]).toBe(ObjectType.Spawn);
    });

    it('should update the tile to the object', () => {
        spyOn(service, 'getObject').and.returnValue(ObjectType.Kunee);
        spyOn(service, 'isObject').and.returnValue(true);
        spyOn(service, 'isInInitialPosition').and.returnValue(false);
        service.updateTile(playerNavigation);
        expect(service.positions[playerNavigation.position.x][playerNavigation.position.y]).toBe(ObjectType.Kunee);
    });

    it('should put 0 if the object is spawn', () => {
        service.objects = mockObjectsMatrice;
        service.initializeObjects(mockObjectsMatrice);
        expect(service.objects[0][0]).toEqual(0);
        expect(service.objects[0][1]).toEqual(0);
    });

    it('should update tile with 0 if other conditions fail', () => {
        spyOn(service, 'isObject').and.returnValue(false);
        spyOn(service, 'isInInitialPosition').and.returnValue(false);
        service.updateTile(playerNavigation);
        expect(service.positions[playerNavigation.position.x][playerNavigation.position.y]).toBe(0);
    });

    it('should update this.players', () => {
        service.players = mockPlayers;
        const numberOfPlayers = service.players.length;
        service.removePlayer(playerNavigation);
        expect(service.players.length).toBe(numberOfPlayers);
    });

    it('should remove the player from this.positions', () => {
        service.removePlayer(playerNavigation);
        expect(service.positions[playerNavigation.position.x][playerNavigation.position.y]).toBe(0);
    });

    it('should return false if the tile is not reachable', () => {
        service['reachableTiles'] = [{ x: 1, y: 1 }];
        const result = service.isReachableTile(2, 2);
        expect(result).toBeFalse();
    });

    it('should return true if the tile is reachable', () => {
        service['reachableTiles'] = [{ x: 1, y: 1 }];
        const result = service.isReachableTile(1, 1);
        expect(result).toBeTrue();
    });

    it('should return true if there is neighbor', () => {
        spyOn(service, 'getNeighbors').and.returnValue([{ x: 1, y: 1 }]);
        expect(service.isNeighbor(1, 1, playerNavigation)).toBeTrue();
    });

    it('should return false if there is no neighbor', () => {
        spyOn(service, 'getNeighbors').and.returnValue([{ x: 1, y: 1 }]);
        expect(service.isNeighbor(0, 0, playerNavigation)).toBeFalse();
    });

    it('should get the neighbors', () => {
        spyOn<any>(service, 'isValidTile').and.returnValue(true);
        const result = service.getNeighbors({ x: 0, y: 0 }, mockGame);
        expect(result).toBeDefined();
    });

    it('should return true if tile is valid', () => {
        const result = service['isValidTile'](1, 1, SIZE_SMALL_MAP);
        expect(result).toBeTrue();
    });

    it('should return false if tile is not valid', () => {
        let result = service['isValidTile'](-1, 2, SIZE_SMALL_MAP);
        expect(result).toBeFalse();

        result = service['isValidTile'](1, -1, SIZE_SMALL_MAP);
        expect(result).toBeFalse();

        result = service['isValidTile'](1, 1, 0);
        expect(result).toBeFalse();
    });

    it('should initialize gameMap and playsers ', () => {
        expect(service.gameMap).toEqual(mockGame);
        expect(service.players).toEqual([player]);
    });

    it('should return true if the position contains an spwan point ', () => {
        expect(service.isInInitialPosition({ x: 0, y: 0 })).toBeTruthy();
    });

    it('should return true if the position contains an object ', () => {
        service['objects'][0][0] = ObjectType.Kunee;
        expect(service.isObject({ x: 0, y: 0 })).toBeTrue();
    });

    it('should return the object at the position ', () => {
        service['objects'] = [[1, 0]];
        expect(service.getObject({ x: 0, y: 0 })).toEqual(1);
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

    it('should return an the Spawn if the god string is empty', () => {
        const result = service.getPortraitId('');
        expect(result).toEqual(ObjectType.Spawn);
    });

    it('should return the spawn for unknown names', () => {
        expect(service.getPortraitId('')).toBe(ObjectType.Spawn);
    });
});
