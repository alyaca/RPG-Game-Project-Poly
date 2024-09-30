import { TestBed } from '@angular/core/testing';
import { NO_OBJECT, ObjectType } from '@app/constants';
import { mockObjects } from '@app/mocks/mock-object';
import { GameObjectService } from './game-object.service';

describe('GameObjectService', () => {
    let service: GameObjectService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameObjectService);
        service.objects = mockObjects;
        service.objectsArray = [[ObjectType.Armor], [NO_OBJECT]];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getObjectById', () => {
        it('should return the correct object by id', () => {
            const result = service.getObjectById(1);
            expect(result).toEqual(mockObjects[0]);
        });

        it('should return undefined if no object has the corresponding id', () => {
            const result = service.getObjectById(9);
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

            const gameObject = service.objects[1];
            service.updateObjectGridPosition(gameObject, 1, 0);

            expect(service.objectsArray[0][0]).toBe(NO_OBJECT);
            expect(service.objectsArray[1][0]).toBe(gameObject.id);

            spyOn(service, 'resetDrag');
            service.updateObjectGridPosition(gameObject, 1, 0);
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
    });
});
