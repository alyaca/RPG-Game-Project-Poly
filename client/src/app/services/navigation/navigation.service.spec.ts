import { TestBed } from '@angular/core/testing';
import { DEFAULT_ATTRIBUTE, NO_OBJECT, ObjectType, SIZE_SMALL_MAP, TileCost, TileType } from '@app/constants';
import { PointWithDistance } from '@app/interfaces/map-position';
import { mockGameNavigation as mockGame, mockGameNavigation, mockNeighborGame } from '@app/mocks/mock-map';
import { playerNavigation as player, playerNavigation } from '@app/mocks/mock-player';
import { mockPlayers } from '@app/mocks/mock-players';
import { Position } from '@common/player';
import { NavigationService } from './navigation.service';
/* eslint max-lines: ["off"] */
/* eslint-disable  @typescript-eslint/no-explicit-any */

describe('NavigationServiceService', () => {
    let service: NavigationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(NavigationService);
        service.initialize(mockGame, [player], mockGame.tiles);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
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
        expect(service.players.length).toBe(numberOfPlayers - 1);
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

    it('checkDoor should return the neighbors', () => {
        service.players = [playerNavigation];
        service.gameMap.tiles = [
            [TileType.Ground, TileType.OpenDoor],
            [TileType.OpenDoor, TileType.Ground],
        ];
        spyOn(service, 'getNeighbors').and.returnValue([{ x: 1, y: 0 }]);
        const result = service.checkDoor();
        expect(result).toBeDefined();
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

    describe('exploreNeighborsForReachableTiles', () => {
        let priorityQueue: PointWithDistance[];
        let maxMovementPoints: number;

        beforeEach(() => {
            priorityQueue = [];

            service['distances'] = [
                [Infinity, Infinity, Infinity],
                [Infinity, Infinity, Infinity],
                [Infinity, Infinity, Infinity],
            ];

            service['previous'] = [
                [
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                ],
                [
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                ],
                [
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                ],
            ];

            service.positions = [
                [NO_OBJECT, NO_OBJECT, NO_OBJECT],
                [NO_OBJECT, NO_OBJECT, NO_OBJECT],
                [NO_OBJECT, NO_OBJECT, NO_OBJECT],
            ];
        });

        it('should skip walls', () => {
            const neighbors = [
                { x: 0, y: 2 },
                { x: 2, y: 0 },
            ];
            const current: PointWithDistance = { x: 1, y: 1, distance: 0 };

            service['exploreNeighborsForReachableTiles'](neighbors, current, priorityQueue, DEFAULT_ATTRIBUTE, mockNeighborGame);

            expect(service['distances'][0][2]).toBe(Infinity);
            expect(service['distances'][2][0]).toBe(Infinity);
        });

        it('should skip tiles occupied by objects of type >= Hestia', () => {
            service.positions[0][1] = ObjectType.Hestia;

            const neighbors = [{ x: 0, y: 1 }];
            const current: PointWithDistance = { x: 1, y: 1, distance: 0 };

            service['exploreNeighborsForReachableTiles'](neighbors, current, priorityQueue, DEFAULT_ATTRIBUTE, mockNeighborGame);
            expect(service['distances'][0][1]).toBe(Infinity);
        });

        it('should process reachable tiles', () => {
            const neighbors = [{ x: 1, y: 0 }];
            const current: PointWithDistance = { x: 1, y: 1, distance: 0 };

            service['exploreNeighborsForReachableTiles'](neighbors, current, priorityQueue, DEFAULT_ATTRIBUTE, mockNeighborGame);
            const expectedDistance = 1;

            expect(service['distances'][1][0]).toBe(expectedDistance);
            expect(priorityQueue).toContain({ x: 1, y: 0, distance: expectedDistance });
        });

        it('should not process tiles if new distance exceeds maxMovementPoints', () => {
            maxMovementPoints = 0;
            const neighbors = [{ x: 1, y: 0 }];
            const current: PointWithDistance = { x: 1, y: 1, distance: 0 };

            service['exploreNeighborsForReachableTiles'](neighbors, current, priorityQueue, maxMovementPoints, mockNeighborGame);
            expect(service['distances'][1][0]).toBe(Infinity);
            expect(priorityQueue).not.toContain({ x: 1, y: 0, distance: Infinity });
        });

        it('should update distances and previous correctly for reachable tiles', () => {
            const neighbors = [{ x: 1, y: 0 }];
            const current: PointWithDistance = { x: 1, y: 1, distance: 0 };

            service['exploreNeighborsForReachableTiles'](neighbors, current, priorityQueue, DEFAULT_ATTRIBUTE, mockNeighborGame);

            expect(service['distances'][1][0]).toBe(1);
            expect(service['distances'][1][0]).toEqual(1);
        });
    });

    it('should return the next node if it is not empty', () => {
        const result = service['getNextNode']([{ x: 0, y: 0, distance: 0 }]);
        expect(result).toEqual({ x: 0, y: 0, distance: 0 });
    });

    it('should return undefined if the queue is empty', () => {
        const result = service['getNextNode']([]);
        expect(result).toBeUndefined();
    });

    it('isDestinationReached should return true if the player is a destination', () => {
        const result = service['isDestinationReached']({ x: 1, y: 1, distance: 1 }, { x: 1, y: 1 });
        expect(result).toBeTrue();
    });

    it('isDestinationReached should return false if the player hasnt arrived yet', () => {
        const result = service['isDestinationReached']({ x: 1, y: 1, distance: 1 }, { x: 0, y: 0 });
        expect(result).toBeFalse();
    });

    describe('exploreNeighbors', () => {
        beforeEach(() => {
            service['distances'] = [
                [Infinity, Infinity, Infinity],
                [Infinity, Infinity, Infinity],
                [Infinity, Infinity, Infinity],
            ];
            service['previous'] = [
                [
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                ],
                [
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                ],
                [
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                    { x: 0, y: 0 },
                ],
            ];
        });
        it('should skip walls', () => {
            const neighbors: Position[] = [
                { x: 0, y: 2 },
                { x: 2, y: 0 },
            ];

            const current = { x: 1, y: 1, distance: 0 };
            const priorityQueue = [{ x: 1, y: 1, distance: 0 }];

            service['exploreNeighbors'](neighbors, current, priorityQueue, mockNeighborGame);

            expect(service['distances'][0][2]).toBe(Infinity);
            expect(service['distances'][2][0]).toBe(Infinity);
        });

        it('should skip objects that block movement', () => {
            service.positions[0][1] = ObjectType.Hestia;

            const neighbors: Position[] = [
                { x: 0, y: 1 },
                { x: 1, y: 0 },
            ];

            const current = { x: 1, y: 1, distance: 0 };
            const priorityQueue = [{ x: 1, y: 1, distance: 0 }];

            service['exploreNeighbors'](neighbors, current, priorityQueue, mockNeighborGame);

            expect(service['distances'][0][1]).toBe(Infinity);

            expect(service['distances'][1][0]).toBe(TileCost.Ground);
            expect(priorityQueue).toContain({ x: 1, y: 0, distance: TileCost.Ground });
        });

        it('should correctly update distances and previous matrices for valid tiles', () => {
            const neighbors: Position[] = [
                { x: 1, y: 0 },
                { x: 1, y: 2 },
            ];

            const current = { x: 1, y: 1, distance: 0 };
            const priorityQueue = [{ x: 1, y: 1, distance: 0 }];

            service['exploreNeighbors'](neighbors, current, priorityQueue, mockNeighborGame);

            expect(service['distances'][1][0]).toBe(TileCost.Ground);
            expect(service['distances'][1][2]).toBe(TileCost.Ground);

            expect(service['previous'][1][0]).toEqual({ x: 1, y: 1 });
            expect(service['previous'][1][2]).toEqual({ x: 1, y: 1 });

            expect(priorityQueue).toContain({ x: 1, y: 0, distance: TileCost.Ground });
            expect(priorityQueue).toContain({ x: 1, y: 2, distance: TileCost.Ground });
        });
    });

    // it('should return the correct path', () => {
    //     service['previous'] = [
    //         [
    //             { x: 0, y: 0 },
    //             { x: 1, y: 0 },
    //         ],
    //         [
    //             { x: 0, y: 0 },
    //             { x: 1, y: 0 },
    //         ],
    //     ];
    //     const result = service['reconstructPath']({ x: 1, y: 0 });

    //     expect(result).toEqual([
    //         { x: 0, y: 0 },
    //         { x: 1, y: 0 },
    //     ]);
    // });

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

    it('should return the path excluding the first position if the destination is reachable', () => {
        service.initialize(mockGameNavigation, [playerNavigation], mockGame.tiles);
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
});
