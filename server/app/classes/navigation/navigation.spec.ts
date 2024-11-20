import { DEFAULT_ATTRIBUTE, TileCost, TileType } from '@app/constants';
import { mockGameNavigation } from '@app/mocks/map-mocks';
import { mockGame } from '@app/mocks/mock-game';
import { playerNavigation } from '@app/mocks/mock-player';
import { mockNavigationPlayers } from '@app/mocks/mock-players';
import { Position } from '@common/player';
import { Navigation } from './navigation';

describe('Navigation', () => {
    let navigation: Navigation;

    beforeEach(() => {
        navigation = new Navigation();
        navigation.gameMap = mockGameNavigation;
        navigation.positions = mockGameNavigation.itemPlacement;
        navigation.players = mockNavigationPlayers;
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

    it('should return [] if the tile is not reachable', () => {
        navigation.isReachableTile = jest.fn().mockReturnValue(false);
        expect(navigation.navigateToTile(playerNavigation, { x: 1, y: 1 }, mockGame)).toEqual([]);
    });

    it('should return undefined if the player is not adjacent to anyone else', () => {
        navigation.players = [playerNavigation];
        navigation.getNeighbors = jest.fn().mockReturnValue([{ x: 1, y: 1 }]);
        expect(navigation.checkAttack(playerNavigation, mockNavigationPlayers)).toBeUndefined();
    });

    it('should return the player adjacent to the active one', () => {
        navigation.players = [playerNavigation];
        navigation.getNeighbors = jest.fn().mockReturnValue([{ x: 0, y: 0 }]);
        navigation.hasPlayerOnTile = jest.fn().mockReturnValue(true);
        expect(navigation.checkAttack(playerNavigation, mockNavigationPlayers)).toEqual(playerNavigation);
    });

    it('should return true if checkAttack or checkDoor return an array', () => {
        navigation.checkAttack = jest.fn().mockReturnValue(playerNavigation);
        navigation.checkDoor = jest.fn().mockReturnValue(undefined);
        expect(navigation.haveActions(playerNavigation, mockNavigationPlayers)).toBe(true);

        navigation.checkAttack = jest.fn().mockReturnValue(undefined);
        navigation.checkDoor = jest.fn().mockReturnValue({ x: 1, y: 0 });
        expect(navigation.haveActions(playerNavigation, mockNavigationPlayers)).toBe(true);
    });

    it('haveActions should return false if checkAttack and checkDoor return undefined', () => {
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

    it('should call getTileCost', () => {
        navigation['previous'] = [
            [
                { x: 1, y: 0 },
                { x: 1, y: 0 },
            ],
            [
                { x: 1, y: 0 },
                { x: 1, y: 0 },
            ],
        ];
        navigation['distances'] = [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
        ];
        navigation.getTileCost = jest.fn().mockReturnValue(TileCost.Ice);
        navigation['exploreNeighborsForReachableTiles'](
            [{ x: 1, y: 2 }],
            { x: 0, y: 0, distance: 0 },
            [{ x: 0, y: 0, distance: 0 }],
            DEFAULT_ATTRIBUTE,
            mockGameNavigation,
        );
        expect(navigation.getTileCost).toHaveBeenCalled();
    });

    // Tests from navigation client

    // it('should call everything', () => {
    //     service['previous'] = [
    //         [
    //             { x: 1, y: 1 },
    //             { x: 1, y: 1 },
    //         ],
    //         [
    //             { x: 1, y: 1 },
    //             { x: 1, y: 1 },
    //         ],
    //     ];
    //     const getNextNodeSpy = spyOn<any>(service, 'getNextNode');
    //     const isDestinationReachedSpy = spyOn<any>(service, 'isDestinationReached');
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

    //     service['previous'][1][1] = { x: 1, y: 1 };
    //     const initDistancesSpy = spyOn(service, 'initializeDistances');
    //     const getNeighborsSpy = spyOn(service, 'getNeighbors');
    //     const exploreNeighborsSpy = spyOn<any>(service, 'exploreNeighbors');
    //     const reconstructPathSpy = spyOn<any>(service, 'reconstructPath');
    //     service.findFastestPath(playerNavigation, { x: 1, y: 1 }, mockGame);
    //     expect(initDistancesSpy).toHaveBeenCalledWith(playerNavigation, mockGame);
    //     expect(getNextNodeSpy).toHaveBeenCalled();
    //     expect(isDestinationReachedSpy).toHaveBeenCalled();
    //     expect(exploreNeighborsSpy).toHaveBeenCalled();
    //     expect(getNeighborsSpy).toHaveBeenCalled();
    //     expect(reconstructPathSpy).toHaveBeenCalledWith({ x: 1, y: 1 });
    // });

    // it('should call everything with findReachableTiles', () => {
    //     const getNeighborsSpy = spyOn(service, 'getNeighbors');
    //     const exploreNeighborsForReachableTilesSpy = spyOn<any>(service, 'exploreNeighborsForReachableTiles');
    //     const getNextNodeSpy = spyOn<any>(service, 'getNextNode');
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

    //     const result = service.findReachableTiles(playerNavigation, mockGame, DEFAULT_ATTRIBUTE);
    //     expect(result).toBeDefined();
    //     expect(getNextNodeSpy).toHaveBeenCalled();
    //     expect(getNeighborsSpy).toHaveBeenCalled();
    //     expect(exploreNeighborsForReachableTilesSpy).toHaveBeenCalled();
    // });
});
