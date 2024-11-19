import { TileType } from '@app/constants';
import { mockGame } from '@app/mocks/mock-game';
import { Position } from '@common/player';
import { Navigation } from './navigation';

describe('Navigation', () => {
    let navigation: Navigation;

    beforeEach(() => {
        navigation = new Navigation();
        navigation.gameMap = mockGame;
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
});
