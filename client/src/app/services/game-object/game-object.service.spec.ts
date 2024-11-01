import { TestBed } from '@angular/core/testing';
import { ITEM_COUNT, MapSize, NB_ITEMS_MEDIUM_MAP, NO_OBJECT, OBJECT_COUNT_MAP, ObjectType, SIZE_MEDIUM_MAP } from '@app/constants';
import { mockGameObject, mockGameObjectZeroId } from '@app/mocks/mock-game';
import { mockObjects } from '@app/mocks/mock-object';
import { mockSelectedTile } from '@app/mocks/mock-selected-tile';
import { GameObjectService } from './game-object.service';

describe('GameObjectService', () => {
    let service: GameObjectService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameObjectService);
        service.objects = mockObjects;
        service.objectsArray = [
            [ObjectType.Armor, NO_OBJECT],
            [NO_OBJECT, ObjectType.Spawn],
        ];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize objectsArray correctly and set maxCount if mapSize is defined', () => {
        const mockMapSize = 'medium';
        service['gridSize'] = SIZE_MEDIUM_MAP;
        service['mapSize'] = mockMapSize;

        service.initObjectsArray();

        expect(service.objectsArray).toBeDefined();
        expect(service.objectsArray.length).toEqual(SIZE_MEDIUM_MAP);
        expect(service.maxCount).toBe(NB_ITEMS_MEDIUM_MAP);
    });

    describe('getObjectById', () => {
        it('should return the correct object by id', () => {
            const result = service.getObjectById(1);
            expect(result).toEqual(mockObjects[0]);
        });

        it('should return undefined if no object has the corresponding id', () => {
            const result = service.getObjectById(NO_OBJECT);
            expect(result).toBeUndefined();
        });
    });

    it('should return the object on tile', () => {
        const result = service.getGameObjectOnTile(0, 0);
        expect(result).toEqual(mockObjects[1]);
    });

    describe('updateObjectGridPosition', () => {
        it('should update the grid position and reset the drag when dragStartPosition exists', () => {
            service.dragStartPosition = mockSelectedTile;

            const gameObject = service.objects[1];
            service.updateObjectGridPosition(gameObject, 1, 0);

            expect(service.objectsArray[0][0]).toBe(NO_OBJECT);
            expect(service.objectsArray[1][0]).toBe(gameObject.id);
            // eslint-disable-next-line -- resetDrag is private and we want to spy for the test
            spyOn<any>(service, 'resetDrag');
            service.updateObjectGridPosition(gameObject, 1, 0);
            expect(service['resetDrag']).toHaveBeenCalled();
        });
    });

    describe('removeObjectByClick', () => {
        it('should remove object from grid with right-click selected tile', () => {
            service.objectsArray[0][0] = ObjectType.Armor;
            const mockEvent = new MouseEvent('click', { button: 2 });
            spyOn(service, 'getGameObjectOnTile').and.callThrough();

            spyOn(service, 'removeObjectFromGrid');

            service.removeObjectByClick(mockEvent, 0, 0);
            expect(service.removeObjectFromGrid).toHaveBeenCalled();
        });
    });

    describe('removeObjectFromGrid', () => {
        it('should remove object when right-click on object on tile', () => {
            const mockGameObject = mockObjects[1];
            service.objectsArray[0][0] = ObjectType.Armor;
            service.selectedTile = mockSelectedTile;
            service.removeObjectFromGrid(mockGameObject);

            expect(service.objectsArray[0][0]).toBe(NO_OBJECT);
        });

        it('should remove object from start tile when drag to another tile', () => {
            const mockGameObject = mockObjects[1];
            service.objectsArray[0][0] = ObjectType.Armor;
            service.dragStartPosition = mockSelectedTile;
            service.removeObjectFromGrid(mockGameObject);

            expect(service.objectsArray[0][0]).toBe(NO_OBJECT);
        });

        it('should set max count for countable object', () => {
            const mockGameObject = mockObjects[2];
            mockGameObject.count = ITEM_COUNT;
            service['mapSize'] = 'medium';
            service.maxCount = OBJECT_COUNT_MAP[service['mapSize']];
            service.objectsArray[0][0] = mockGameObject.id;
            service.dragStartPosition = mockSelectedTile;
            service.removeObjectFromGrid(mockGameObject);

            expect(service.objectsArray[0][0]).toBe(NO_OBJECT);
            expect(mockGameObject.count).toBe(ITEM_COUNT + 1);
        });

        it('should not increment object count if it is max count', () => {
            const mockGameObject = mockObjects[0];
            service['mapSize'] = 'medium';
            service.maxCount = ITEM_COUNT;
            service.objectsArray[0][0] = mockGameObject.id;
            service.dragStartPosition = mockSelectedTile;
            service.removeObjectFromGrid(mockGameObject);

            expect(service.objectsArray[0][0]).toBe(NO_OBJECT);
            expect(mockGameObject.count).toBe(service.maxCount);
        });
    });

    it('should reset object counts correctly when mapSize is defined', () => {
        service['mapSize'] = 'medium';
        service.resetObjectsCount();

        expect(service.objects[0].count).toBe(ITEM_COUNT);
        expect(service.objects[1].count).toBe(ITEM_COUNT);
        expect(service.objects[2].count).toBe(OBJECT_COUNT_MAP[service['mapSize']]);
    });

    describe('loadMapObjectCount', () => {
        beforeEach(() => {
            service['mapSize'] = MapSize.Small;
            service.objectsArray = [
                [1, NO_OBJECT, 2],
                [NO_OBJECT, NO_OBJECT, NO_OBJECT],
            ];
            service.getObjectById = jasmine.createSpy('getObjectById').and.callFake((id) => {
                return { id, count: 2 };
            });
            service.resetObjectsCount = jasmine.createSpy('resetObjectsCount');
        });

        it('should set maxCount based on mapSize', () => {
            service.loadMapObjectCount();
            service['mapSize'] = MapSize.Small;
            expect(service.maxCount).toBe(OBJECT_COUNT_MAP[service['mapSize']]);
        });

        it('should reset objects count', () => {
            service.loadMapObjectCount();
            expect(service.resetObjectsCount).toHaveBeenCalled();
        });
    });

    it('should set draggedObject if the gameObject exists', () => {
        spyOn(service, 'getGameObjectOnTile').and.returnValue(mockGameObject);
        service.checkGameObject(0, 0);
        expect(service.draggedObject).toEqual(mockGameObject);
    });

    it('should not set draggedObject if the gameObject does not exist', () => {
        spyOn(service, 'getGameObjectOnTile').and.returnValue(undefined);
        service.checkGameObject(0, 0);
        expect(service.draggedObject).toBeDefined();
    });

    it('should return true if the tile is ground', () => {
        const result = service.isValidTileForObject(0, 0, [
            [1, 1],
            [1, 1],
        ]);
        expect(result).toBeTrue();
    });

    it('isValidTileForObject should return false if it is a wall or a door', () => {
        let result = service.isValidTileForObject(0, 0, [
            [4, 1],
            [1, 1],
        ]);
        expect(result).toBeFalse();

        result = service.isValidTileForObject(0, 0, [
            [5, 1],
            [1, 1],
        ]);
        expect(result).toBeFalse();

        result = service.isValidTileForObject(0, 0, [
            [6, 1],
            [1, 1],
        ]);
        expect(result).toBeFalse();
    });

    describe('onDrop', () => {
        beforeEach(() => {
            spyOn(service, 'updateObjectGridPosition');
        });

        it('should not call updateObjectGridPosition if the condition is not met', () => {
            service.draggedObject = null;
            const mockEvent = new DragEvent('drop');
            spyOn(service, 'isValidTileForObject').and.returnValue(false);
            service.onDrop(
                mockEvent,
                0,
                0,
                [
                    [0, 0],
                    [1, 0],
                ],
                [
                    [1, 1],
                    [1, 1],
                ],
            );
            expect(service.updateObjectGridPosition).not.toHaveBeenCalled();
        });

        it('should call updateObjectGridPosition if the condition is met', () => {
            service.draggedObject = mockGameObject;
            const mockEvent = new DragEvent('drop');
            spyOn(service, 'isValidTileForObject').and.returnValue(true);
            service.onDrop(
                mockEvent,
                0,
                0,
                [
                    [NO_OBJECT, 0],
                    [1, 0],
                ],
                [
                    [1, 1],
                    [1, 1],
                ],
            );
            expect(service.updateObjectGridPosition).toHaveBeenCalled();
        });
    });

    describe('handleGameObjectOnTile', () => {
        beforeEach(() => {
            spyOn(service, 'removeObjectFromGrid');
        });

        it('should call removeObjectFromGrid if condition is met', () => {
            spyOn(service, 'getGameObjectOnTile').and.returnValue(mockGameObject);
            spyOn(service, 'isValidTileForObject').and.returnValue(false);

            service.handleGameObjectOnTile(0, 0, [
                [1, 1],
                [1, 1],
            ]);
            expect(service.removeObjectFromGrid).toHaveBeenCalled();
        });

        it('should not call removeObjectFromGrid if condition is not met', () => {
            spyOn(service, 'getGameObjectOnTile').and.returnValue(undefined);
            spyOn(service, 'isValidTileForObject').and.returnValue(true);
            service.handleGameObjectOnTile(0, 0, [
                [0, 0],
                [0, 0],
            ]);
            expect(service.removeObjectFromGrid).not.toHaveBeenCalled();
        });

        it('should not call removeObjectFromGrid if the gameObject.id is 0', () => {
            spyOn(service, 'getGameObjectOnTile').and.returnValue(mockGameObjectZeroId);
            service.handleGameObjectOnTile(0, 0, [
                [1, 1],
                [1, 1],
            ]);
            expect(service.removeObjectFromGrid).not.toHaveBeenCalled();
        });
    });
});
