import { DEFAULT_ATTRIBUTE, NO_ITEM, TileCost, TileType } from '@app/constants';
import { mockGameNavigation, mockNeighborGame } from '@app/mocks/map-mocks';
import { mockGame } from '@app/mocks/mock-game';
import { playerNavigation } from '@app/mocks/mock-player';
import { mockNavigationPlayers } from '@app/mocks/mock-players';
import { mockRoomDebug } from '@app/mocks/mock-room';
import { ObjectType } from '@common/avatars-info';
import { Position } from '@common/player';
import { PointWithDistance } from '@common/point-distance.interface';
import { Navigation } from './navigation';

/* eslint max-lines: ["off"] */
describe('Navigation', () => {
    let navigation: Navigation;

    beforeEach(() => {
        navigation = new Navigation(mockGameNavigation, mockGameNavigation.itemPlacement, mockNavigationPlayers);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should toggle door state', () => {
        let result = navigation['toggleDoorState'](TileType.ClosedDoor);
        expect(result).toEqual(TileType.OpenDoor);

        result = navigation['toggleDoorState'](TileType.OpenDoor);
        expect(result).toEqual(TileType.ClosedDoor);

        result = navigation['toggleDoorState'](TileType.Ground);
        expect(result).toEqual(TileType.Ground);
    });

    it('should return true if the tile is ClosedDoor or OpenDoor', () => {
        let position: Position = { x: 1, y: 1 };
        navigation.gameMap.tiles = [
            [TileType.Ground, TileType.OpenDoor],
            [TileType.Ground, TileType.ClosedDoor],
        ];
        const resultClose = navigation['isTileDoor'](position);
        expect(resultClose).toBe(true);

        position = { x: 0, y: 1 };
        const resultOpen = navigation['isTileDoor'](position);
        expect(resultOpen).toBe(true);
    });

    it('should initialize all the attributes', () => {
        navigation.initializeDistances(playerNavigation, mockGame);
        expect(navigation['distances'].length).toEqual(mockGame.dimension);
        expect(navigation['previous'].length).toEqual(mockGame.dimension);
        expect(navigation['distances'][playerNavigation.position.x][playerNavigation.position.y]).toEqual(0);
    });

    // it('should return false if the player is not adjacent to anyone else', () => {
    //     navigation.players = [playerNavigation];
    //     navigation.getNeighbors = jest.fn().mockReturnValue([{ x: 1, y: 1 }]);
    //     expect(navigation.checkAttack(playerNavigation, mockNavigationPlayers)).toBe(false);
    // });

    // it('should return true if a player is adjacent to the active one', () => {
    //     navigation.players = [playerNavigation];
    //     navigation.getNeighbors = jest.fn().mockReturnValue([{ x: 0, y: 0 }]);
    //     navigation.hasPlayerOnTile = jest.fn().mockReturnValue(true);
    //     expect(navigation.checkAttack(playerNavigation, mockNavigationPlayers)).toBe(true);
    // });

    it('should return true if checkAttack or checkDoor return an array', () => {
        navigation.hasActionPoints = jest.fn().mockReturnValue(true);
        navigation.checkAttack = jest.fn().mockReturnValue(playerNavigation);
        navigation.checkDoor = jest.fn().mockReturnValue(undefined);
        expect(navigation.haveActions(playerNavigation, mockNavigationPlayers)).toBe(true);

        navigation.checkAttack = jest.fn().mockReturnValue(undefined);
        navigation.checkDoor = jest.fn().mockReturnValue({ x: 1, y: 0 });
        expect(navigation.haveActions(playerNavigation, mockNavigationPlayers)).toBe(true);
    });

    it('haveActions should return false if checkAttack and checkDoor return undefined', () => {
        navigation.hasActionPoints = jest.fn().mockReturnValue(true);
        navigation.checkAttack = jest.fn().mockReturnValue(undefined);
        navigation.checkDoor = jest.fn().mockReturnValue(undefined);
        expect(navigation.haveActions(playerNavigation, mockNavigationPlayers)).toBe(false);
    });

    it('should return the correct tile cost', () => {
        expect(navigation.getTileCost(TileType.Ground)).toEqual(TileCost.Ground);
        expect(navigation.getTileCost(TileType.Water)).toEqual(TileCost.Water);
        expect(navigation.getTileCost(TileType.Ice)).toEqual(TileCost.Ice);
        expect(navigation.getTileCost(TileType.OpenDoor)).toEqual(TileCost.OpenDoor);
        expect(navigation.getTileCost(TileType.Wall)).toEqual(Infinity);
    });

    // it('should call getTileCost', () => {
    //     navigation['previous'] = [
    //         [
    //             { x: 1, y: 0 },
    //             { x: 1, y: 0 },
    //         ],
    //         [
    //             { x: 1, y: 0 },
    //             { x: 1, y: 0 },
    //         ],
    //     ];
    //     navigation['distances'] = [
    //         [1, 1, 1],
    //         [1, 1, 1],
    //         [1, 1, 1],
    //     ];
    //     navigation.getTileCost = jest.fn().mockReturnValue(TileCost.Ice);
    //     navigation['exploreNeighborsForReachableTiles'](
    //         [{ x: 1, y: 2 }],
    //         { x: 0, y: 0, distance: 0 },
    //         [{ x: 0, y: 0, distance: 0 }],
    //         DEFAULT_ATTRIBUTE,
    //         mockGameNavigation,
    //     );
    //     expect(navigation.getTileCost).toHaveBeenCalled();
    // });

    describe('exploreNeighborsForReachableTiles', () => {
        let priorityQueue: PointWithDistance[];
        // let maxMovementPoints: number;

        beforeEach(() => {
            priorityQueue = [];

            navigation['distances'] = [
                [Infinity, Infinity, Infinity],
                [Infinity, Infinity, Infinity],
                [Infinity, Infinity, Infinity],
            ];

            navigation['previous'] = [
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

            navigation.positions = [
                [NO_ITEM, NO_ITEM, NO_ITEM],
                [NO_ITEM, NO_ITEM, NO_ITEM],
                [NO_ITEM, NO_ITEM, NO_ITEM],
            ];
        });

        it('should skip walls', () => {
            const neighbors = [
                { x: 0, y: 2 },
                { x: 2, y: 0 },
            ];
            const current: PointWithDistance = { x: 1, y: 1, distance: 0 };

            navigation['exploreNeighborsForReachableTiles'](neighbors, current, priorityQueue, DEFAULT_ATTRIBUTE, mockNeighborGame);

            expect(navigation['distances'][0][2]).toBe(Infinity);
            expect(navigation['distances'][2][0]).toBe(Infinity);
        });

        it('should skip tiles occupied by player', () => {
            navigation.positions[2][0] = ObjectType.Hestia;

            const neighbors = [{ x: 2, y: 0 }];
            const current: PointWithDistance = { x: 1, y: 1, distance: 0 };

            navigation['exploreNeighborsForReachableTiles'](neighbors, current, priorityQueue, DEFAULT_ATTRIBUTE, mockNeighborGame);
            expect(navigation['distances'][2][0]).toBe(Infinity);
        });

        // it('should process reachable tiles', () => {
        //     const neighbors = [{ x: 1, y: 0 }];
        //     const current: PointWithDistance = { x: 1, y: 1, distance: 0 };

        //     navigation['exploreNeighborsForReachableTiles'](neighbors, current, priorityQueue, DEFAULT_ATTRIBUTE, mockNeighborGame);
        //     const expectedDistance = 1;

        //     expect(navigation['distances'][1][0]).toBe(expectedDistance);
        //     expect(priorityQueue).toEqual([{ x: 1, y: 0, distance: expectedDistance }]);
        // });

        // it('should not process tiles if new distance exceeds maxMovementPoints', () => {
        //     maxMovementPoints = 0;
        //     const neighbors = [{ x: 1, y: 0 }];
        //     const current: PointWithDistance = { x: 1, y: 1, distance: 0 };

        //     navigation['exploreNeighborsForReachableTiles'](neighbors, current, priorityQueue, maxMovementPoints, mockNeighborGame);
        //     expect(navigation['distances'][1][0]).toBe(Infinity);
        //     expect(priorityQueue).not.toContain({ x: 1, y: 0, distance: Infinity });
        // });

        // it('should update distances and previous correctly for reachable tiles', () => {
        //     const neighbors = [{ x: 1, y: 0 }];
        //     const current: PointWithDistance = { x: 1, y: 1, distance: 0 };

        //     navigation['exploreNeighborsForReachableTiles'](neighbors, current, priorityQueue, DEFAULT_ATTRIBUTE, mockNeighborGame);

        //     expect(navigation['distances'][1][0]).toBe(1);
        //     expect(navigation['distances'][1][0]).toEqual(1);
        // });
    });

    it('should return the next node if it is not empty', () => {
        const result = navigation['getNextNode']([
            { x: 0, y: 0, distance: 0 },
            { x: 1, y: 1, distance: 1 },
        ]);
        expect(result).toEqual({ x: 0, y: 0, distance: 0 });
    });

    it('should return undefined if the queue is empty', () => {
        const result = navigation['getNextNode']([]);
        expect(result).toBeUndefined();
    });

    it('isDestinationReached should return true if the player is a destination', () => {
        const result = navigation['isDestinationReached']({ x: 1, y: 1, distance: 1 }, { x: 1, y: 1 });
        expect(result).toBe(true);
    });

    it('isDestinationReached should return false if the player hasnt arrived yet', () => {
        const result = navigation['isDestinationReached']({ x: 1, y: 1, distance: 1 }, { x: 0, y: 0 });
        expect(result).toBe(false);
    });

    describe('exploreNeighbors', () => {
        beforeEach(() => {
            navigation['distances'] = [
                [Infinity, Infinity, Infinity],
                [Infinity, Infinity, Infinity],
                [Infinity, Infinity, Infinity],
            ];
            navigation['previous'] = [
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

            navigation['exploreNeighbors'](neighbors, current, priorityQueue, mockNeighborGame);

            expect(navigation['distances'][0][2]).toBe(Infinity);
            expect(navigation['distances'][2][0]).toBe(Infinity);
        });

        // it('should skip objects that block movement', () => {
        //     navigation.positions[2][0] = ObjectType.Hestia;

        //     const neighbors: Position[] = [
        //         { x: 2, y: 0 },
        //         { x: 1, y: 0 },
        //     ];

        //     const current = { x: 1, y: 1, distance: 0 };
        //     const priorityQueue = [{ x: 1, y: 1, distance: 0 }];

        //     navigation['exploreNeighbors'](neighbors, current, priorityQueue, mockNeighborGame);

        //     expect(navigation['distances'][2][0]).toBe(Infinity);
        //     expect(navigation['distances'][1][0]).toBe(TileCost.Ground);
        // });

        // it('should correctly update distances and previous matrices for valid tiles', () => {
        //     const neighbors: Position[] = [
        //         { x: 1, y: 0 },
        //         { x: 1, y: 2 },
        //     ];

        //     const current = { x: 1, y: 1, distance: 0 };
        //     const priorityQueue = [{ x: 1, y: 1, distance: 0 }];

        //     navigation['exploreNeighbors'](neighbors, current, priorityQueue, mockNeighborGame);

        //     expect(navigation['distances'][1][0]).toBe(TileCost.Ground);
        //     expect(navigation['distances'][1][2]).toBe(TileCost.Ground);

        //     expect(navigation['previous'][1][0]).toEqual({ x: 1, y: 1 });
        //     expect(navigation['previous'][1][2]).toEqual({ x: 1, y: 1 });
        // });
    });

    it('should return the correct path', () => {
        navigation['previous'] = [
            [null, null],
            [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
            ],
        ];
        const result = navigation['reconstructPath']({ x: 1, y: 0 });

        expect(result).toEqual([
            { x: 0, y: 0 },
            { x: 1, y: 0 },
        ]);
    });

    it('should return the final destination if room in debug mode and the tile is valid', () => {
        const destination = { x: 1, y: 1 };

        navigation['isTileValid'] = jest.fn().mockReturnValue(true);

        const result = navigation.findFastestPath(playerNavigation, destination, mockRoomDebug[0]);
        expect(result).toEqual([destination]);
    });

    it('should return all tiles in debug mode', () => {
        const mockDebugTiles = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: 2 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 1, y: 2 },
            { x: 2, y: 0 },
            { x: 2, y: 1 },
            { x: 2, y: 2 },
        ];

        navigation['isTileValid'] = jest.fn().mockReturnValue(true);
        const result = navigation.findReachableTiles(playerNavigation, mockRoomDebug[0]);
        expect(result).toEqual(mockDebugTiles);
    });

    it('should return false when the tiles are not valid for debug Mode', () => {
        const position: Position = { x: 1, y: 1 };
        navigation.gameMap.tiles = [
            [TileType.Ground, TileType.OpenDoor],
            [TileType.Wall, TileType.ClosedDoor],
        ];
        navigation.gameMap.itemPlacement = [
            [NO_ITEM, NO_ITEM],
            [NO_ITEM, NO_ITEM],
        ];

        navigation['hasPlayerOnTile'] = jest.fn().mockReturnValue(false);
        const isValid = navigation['isTileValid'](position.x, position.y);
        expect(isValid).toBe(false);
    });

    it('should return false when the tiles are terrain tile, but there is an objet on it', () => {
        const position: Position = { x: 0, y: 0 };

        navigation.gameMap.tiles = [
            [TileType.Ground, TileType.OpenDoor],
            [TileType.Wall, TileType.ClosedDoor],
        ];
        navigation.gameMap.itemPlacement = [
            [TileType.ClosedDoor, NO_ITEM],
            [NO_ITEM, NO_ITEM],
        ];

        navigation['hasPlayerOnTile'] = jest.fn().mockReturnValue(false);
        const isValid = navigation['isTileValid'](position.x, position.y);
        expect(isValid).toBe(false);
    });

    it('should return true when the tiles are valid for debug Mode', () => {
        const position: Position = { x: 0, y: 0 };
        navigation.gameMap.tiles = [
            [TileType.Ground, TileType.OpenDoor],
            [TileType.Wall, TileType.ClosedDoor],
        ];
        navigation.gameMap.itemPlacement = [
            [NO_ITEM, NO_ITEM],
            [NO_ITEM, NO_ITEM],
        ];

        navigation['hasPlayerOnTile'] = jest.fn().mockReturnValue(false);
        const isValid = navigation['isTileValid'](position.x, position.y);
        expect(isValid).toBe(true);
    });

    // TODO : Tests from navigation client to fix

    // it('should call everything', () => {
    //     navigation['previous'] = [
    //         [
    //             { x: 1, y: 1 },
    //             { x: 1, y: 1 },
    //         ],
    //         [
    //             { x: 1, y: 1 },
    //             { x: 1, y: 1 },
    //         ],
    //     ];
    //     const getNextNodeSpy = spyOn<any>(navigation, 'getNextNode');
    //     const isDestinationReachedSpy = spyOn<any>(navigation, 'isDestinationReached');
    //     getNextNodeSpy.and.callFake(() => {
    //         const callCounter = getNextNodeSpy.calls.count();
    //         if (callCounter === 1) {
    //             return { x: 1, y: 1, distance: 1 };
    //         } else {
    //             return undefined;
    //         }
    //     });

    //     isDestinationReachedSpy.and.callFake(() => {
    //         const callCounter = isDestinationReachedSpy.calls.count();
    //         if (callCounter === 1) {
    //             return false;
    //         } else {
    //             return true;
    //         }
    //     });

    //     navigation['previous'][1][1] = { x: 1, y: 1 };
    //     const initDistancesSpy = spyOn(navigation, 'initializeDistances');
    //     const getNeighborsSpy = spyOn(navigation, 'getNeighbors');
    //     const exploreNeighborsSpy = spyOn<any>(navigation, 'exploreNeighbors');
    //     const reconstructPathSpy = spyOn<any>(navigation, 'reconstructPath');
    //     navigation.findFastestPath(playerNavigation, { x: 1, y: 1 }, mockGame);
    //     expect(initDistancesSpy).toHaveBeenCalledWith(playerNavigation, mockGame);
    //     expect(getNextNodeSpy).toHaveBeenCalled();
    //     expect(isDestinationReachedSpy).toHaveBeenCalled();
    //     expect(exploreNeighborsSpy).toHaveBeenCalled();
    //     expect(getNeighborsSpy).toHaveBeenCalled();
    //     expect(reconstructPathSpy).toHaveBeenCalledWith({ x: 1, y: 1 });
    // });

    // it('should call everything with findReachableTiles', () => {
    //     const getNeighborsSpy = spyOn(navigation, 'getNeighbors');
    //     const exploreNeighborsForReachableTilesSpy = spyOn<any>(navigation, 'exploreNeighborsForReachableTiles');
    //     const getNextNodeSpy = spyOn<any>(navigation, 'getNextNode');
    //     getNextNodeSpy.and.callFake(() => {
    //         const callCounter = getNextNodeSpy.calls.count();
    //         if (callCounter === 1) {
    //             return { x: 1, y: 1, distance: 1 };
    //         } else {
    //             return undefined;
    //         }
    //     });

    //     getNeighborsSpy.and.callFake(() => {
    //         const callCounter = getNeighborsSpy.calls.count();
    //         if (callCounter === 1) {
    //             return [{ x: 1, y: 1 }];
    //         } else {
    //             return [];
    //         }
    //     });

    //     const result = navigation.findReachableTiles(playerNavigation, mockGame, DEFAULT_ATTRIBUTE);
    //     expect(result).toBeDefined();
    //     expect(getNextNodeSpy).toHaveBeenCalled();
    //     expect(getNeighborsSpy).toHaveBeenCalled();
    //     expect(exploreNeighborsForReachableTilesSpy).toHaveBeenCalled();
    // });

    /* it('sendNavigation should call send teleportPlayer event when navigation is debug mode', () => {
        gameCreationServiceSpy.isModifiable = false;
        component.isActivePlayer = true;
        component.hasStarted = true;
        component.isMoving = false;
        navigationServiceSpy.isDebugMode = true;
        navigationServiceSpy.isTileValid.and.returnValue(true);
        component.sendNavigation(0, 0);
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('teleportPlayer', { x: 0, y: 0 });
    });*/
});
