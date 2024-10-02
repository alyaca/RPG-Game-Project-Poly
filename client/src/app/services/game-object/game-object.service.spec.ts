import { TestBed } from '@angular/core/testing';
import { ITEM_COUNT, NB_ITEMS_MEDIUM_MAP, NO_OBJECT, ObjectType, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP, SMALL_MAP_MAX_OBJ_COUNT } from '@app/constants';
import { mockObjects } from '@app/mocks/mock-object';
import { GameObjectService } from './game-object.service';
import { GameGridService } from '@app/services/game-grid.service';
import { GameObject } from '@app/interfaces/gameObject';
import { Map } from '@app/interfaces/map';

describe('GameObjectService', () => {
    let service: GameObjectService;
    let gameGridServiceSpy: jasmine.SpyObj<GameGridService>;
    beforeEach(() => {
        const gameGridSpy = jasmine.createSpyObj('GameGridService', ['mapToEdit']);
        TestBed.configureTestingModule({
            providers: [GameObjectService, { provide: GameGridService, useValue: gameGridSpy }],
        });
        service = TestBed.inject(GameObjectService);
        gameGridServiceSpy = TestBed.inject(GameGridService) as jasmine.SpyObj<GameGridService>;

        service.objects = [
            { ...mockObjects[0], count: 1 },
            { ...mockObjects[1], count: 1 },
            { id: ObjectType.Spawn, name: 'mock4', description: 'mock spawn', count: ITEM_COUNT, image: 'mock4/image.png' },
            { id: 999, name: 'mock5', description: 'mock spawn', count: ITEM_COUNT, image: 'mock5/image.png' },
        ];
        service.objectsArray = [
            [ObjectType.Armor, NO_OBJECT],
            [NO_OBJECT, ObjectType.Spawn],
        ];

        gameGridServiceSpy.mapToEdit = {
            dimension: SIZE_SMALL_MAP,
            itemPlacement: [
                [ObjectType.Armor, ObjectType.Spawn],
                [NO_OBJECT, ObjectType.Random],
            ],
        } as Map;

        service.objects = mockObjects;
        service.gridSize = SIZE_SMALL_MAP;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should initialize objectsArray correctly and set maxCount if mapSize is defined', () => {
        service.gridSize = SIZE_MEDIUM_MAP;

        service.createNewObjectsArray();

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
            service.dragStartPosition = { row: 0, col: 0 };
            const mockArray = [[NO_OBJECT], [NO_OBJECT]];

            const gameObject = service.objects[1];
            service.updateObjectGridPosition(gameObject, 1, 0, mockArray);

            expect(service.objectsArray[0][0]).toBe(gameObject.id);
            expect(service.objectsArray[1][0]).toBe(NO_OBJECT);

            spyOn(service, 'resetDrag');
            service.updateObjectGridPosition(gameObject, 1, 0, mockArray);
            expect(service.resetDrag).toHaveBeenCalled();
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
            const mockSelectedTile = { row: 0, col: 0 };
            const mockGameObject = mockObjects[1];
            service.objectsArray[0][0] = ObjectType.Armor;
            service.selectedTile = mockSelectedTile;
            service.removeObjectFromGrid(mockGameObject);

            expect(service.objectsArray[0][0]).toBe(NO_OBJECT);
        });

        it('should remove object from start tile when drag to another tile', () => {
            const mockSelectedTile = { row: 0, col: 0 };
            const mockGameObject = mockObjects[1];
            service.objectsArray[0][0] = ObjectType.Armor;
            service.dragStartPosition = mockSelectedTile;
            service.removeObjectFromGrid(mockGameObject);

            expect(service.objectsArray[0][0]).toBe(NO_OBJECT);
        });

        it('should set max count for countable object', () => {
            const mockSelectedTile = { row: 0, col: 0 };
            const mockGameObject = mockObjects[2];
            mockGameObject.count = ITEM_COUNT;

            service.objectsArray[0][0] = mockGameObject.id;
            service.dragStartPosition = mockSelectedTile;
            service.removeObjectFromGrid(mockGameObject);

            expect(service.objectsArray[0][0]).toBe(NO_OBJECT);
            expect(mockGameObject.count).toBe(ITEM_COUNT);
        });

        it('should not increment object count if it is max count', () => {
            const mockSelectedTile = { row: 0, col: 0 };
            const mockGameObject = mockObjects[0];
            service.maxCount = ITEM_COUNT;
            service.objectsArray[0][0] = mockGameObject.id;
            service.dragStartPosition = mockSelectedTile;
            service.removeObjectFromGrid(mockGameObject);

            expect(service.objectsArray[0][0]).toBe(NO_OBJECT);
            expect(mockGameObject.count).toBe(service.maxCount);
        });
    });

    it('should reset object counts correctly when mapSize is defined', () => {
        service.gridSize = SIZE_SMALL_MAP;

        service.resetObjectsCount();

        expect(service.objects[0].count).toBe(ITEM_COUNT);
        expect(service.objects[1].count).toBe(ITEM_COUNT);
        expect(service.objects[2].count).toBe(SMALL_MAP_MAX_OBJ_COUNT);
    });

    it('should update objects container and decrement object counts correctly', () => {
        const objectArray = [
            [ObjectType.Armor, ObjectType.Spawn],
            [NO_OBJECT, ObjectType.Random],
        ];

        const objectsInfo: GameObject[] = [
            { id: ObjectType.Armor, count: 2, name: 'Armor', description: '', image: 'armor.png' },
            { id: ObjectType.Spawn, count: 1, name: 'Spawn', description: '', image: 'spawn.png' },
            { id: ObjectType.Random, count: 3, name: 'Random', description: '', image: 'random.png' },
        ];
        service.updateObjectsContainer(objectArray, objectsInfo);

        expect(service.gridSize).toBe(SIZE_SMALL_MAP);
        expect(service.objectsArray).toEqual(gameGridServiceSpy.mapToEdit.itemPlacement);
        expect(service.maxCount).toBe(SMALL_MAP_MAX_OBJ_COUNT);

        expect(objectsInfo[0].count).toBe(1);
        expect(objectsInfo[1].count).toBe(0);

        expect(objectsInfo[2].count).toBe(2);
    });
});
