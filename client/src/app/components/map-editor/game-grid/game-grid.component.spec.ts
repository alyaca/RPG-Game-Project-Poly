import { SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ITEM_COUNT, NO_OBJECT, ObjectType, SIZE_SMALL_MAP } from '@app/constants';
import { mockObjects } from '@app/mocks/mock-object';
import { MOCK_COLUMN, MOCK_ROW } from '@app/mocks/mock-position';
import { gameObjects } from '@app/objects-info';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { MapValidatorService, TileType } from '@app/services/map-validator/map-validator.service';
import { ToolButtonService } from '@app/services/tool-button/tool-button.service';
import { ToolService } from '@app/services/tool/tool.service';
import { GameGridComponent } from './game-grid.component';

describe('GameGridComponent', () => {
    let component: GameGridComponent;
    let fixture: ComponentFixture<GameGridComponent>;
    let toolServiceSpy: jasmine.SpyObj<ToolService>;
    let mapValidatorServiceSpy: jasmine.SpyObj<MapValidatorService>;
    let gameObjectManagerServiceSpy: jasmine.SpyObj<GameObjectService>;
    let toolButtonServiceSpy: jasmine.SpyObj<ToolButtonService>;
    let gameCreationServiceSpy: jasmine.SpyObj<GameCreationService>;

    beforeEach(async () => {
        toolServiceSpy = jasmine.createSpyObj('ToolService', ['getSelectedTile', 'setSelectedTile', 'deactivateTileApplicator']);
        toolButtonServiceSpy = jasmine.createSpyObj('ToolButtonService', [], { selectedButton: null });
        mapValidatorServiceSpy = jasmine.createSpyObj('MapValidatorService', ['validateMap']);
        gameCreationServiceSpy = jasmine.createSpyObj('GameCreationService', ['updateDimensions']);
        gameObjectManagerServiceSpy = jasmine.createSpyObj('GameObjectManagerService', [
            'initObjectsArray',
            'resetObjectsCount',
            'getObjectById',
            'getGameObjectOnTile',
            'updateObjectGridPosition',
            'removeObjectFromGrid',
            'removeObjectByClick',
            'resetDrag,',
            'loadMapObjectCount',
            'ngOnDestroy',
            'resetObjectsCount',
        ]);

        const tileServiceMock = {
            resetGrid: jasmine.createSpy('resetGrid').and.callFake((gridSize: number) => {
                return Array.from({ length: gridSize }, () => Array.from({ length: SIZE_SMALL_MAP }, () => TileType.Ground));
            }),
        };

        const gameObjectServiceMock = {
            initObjectsArray: jasmine.createSpy('initObjectsArray').and.callFake(() => {
                return Array.from({ length: SIZE_SMALL_MAP }, () => Array.from({ length: SIZE_SMALL_MAP }, () => NO_OBJECT));
            }),
        };

        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                { provide: ToolService, useValue: toolServiceSpy },
                { provide: ToolButtonService, useValue: toolButtonServiceSpy },
                { provide: MapValidatorService, useValue: mapValidatorServiceSpy },
                { provide: GameObjectService, useValue: gameObjectManagerServiceSpy },
                { provide: 'TileService', useValue: tileServiceMock },
                { provide: GameCreationService, useValue: gameCreationServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameGridComponent);
        component = fixture.componentInstance;
        component.gridSize = SIZE_SMALL_MAP;
        component.tilesGrid = tileServiceMock.resetGrid(component.gridSize, component.tilesGrid);
        component.objectsArray = gameObjectServiceMock.initObjectsArray();
        gameObjectManagerServiceSpy.gridSize = SIZE_SMALL_MAP;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize properties correctly', () => {
        expect(component.selectedRow).toBe(0);
        expect(component.selectedCol).toBe(0);
        expect(component.isMouseDown).toBeFalse();
    });

    describe('ngOnInit', () => {
        it('should initialize tiles and objects from loaded data for an existing game', () => {
            gameCreationServiceSpy.updateDimensions.and.returnValue(SIZE_SMALL_MAP);
            gameCreationServiceSpy.isNewGame = false;
            gameCreationServiceSpy.loadedTiles = [
                [1, 1],
                [0, 0],
            ];
            gameCreationServiceSpy.loadedObjects = [
                [2, 2],
                [0, 0],
            ];

            component.ngOnInit();

            expect(gameCreationServiceSpy.updateDimensions).toHaveBeenCalled();
            expect(component.gridSize).toBe(SIZE_SMALL_MAP);
            expect(component.tilesGrid).toEqual([
                [1, 1],
                [0, 0],
            ]);
            expect(component.objectsArray).toEqual([
                [2, 2],
                [0, 0],
            ]);
            expect(gameObjectManagerServiceSpy.objectsArray).toEqual([
                [2, 2],
                [0, 0],
            ]);
        });
    });

    describe('deepCopyMatrix', () => {
        it('should return a deep copy of the matrix', () => {
            const matrix = [
                [1, 2],
                [2, 0],
            ];
            const result = component.deepCopyMatrix(matrix);
            expect(result).toEqual(matrix);
            expect(result).not.toBe(matrix);
        });

        it('should return an empty array if matrix is undefined', () => {
            const result = component.deepCopyMatrix(null);
            expect(result).toEqual([]);
        });
    });

    describe('ngOnChanges', () => {
        it('should reset the grid when resetTrigger changes to true', () => {
            component.tilesGrid[0][0] = TileType.Water;
            const changes: SimpleChanges = {
                resetTrigger: new SimpleChange(false, true, false),
            };

            component.ngOnChanges(changes);
            expect(component.tilesGrid).toEqual([]);
        });

        it('should validate the map when saveTrigger changes to true', () => {
            component.mapName = 'Test Map';
            component.mapDescription = 'Description';
            component.tilesGrid = [[TileType.Ground]];
            gameCreationServiceSpy.isNewGame = true;
            const changes: SimpleChanges = {
                saveTrigger: new SimpleChange(false, true, false),
            };
            component.saveTrigger = true;
            component.ngOnChanges(changes);
            expect(mapValidatorServiceSpy.validateMap).toHaveBeenCalledWith(
                component.tilesGrid,
                component.mapName,
                component.mapDescription,
                true,
                component.oldMapName,
            );
        });

        it('should reset objectsArray and tilesGrid when resetTrigger changes and isNewGame is true', () => {
            gameCreationServiceSpy.isNewGame = true;
            const changes: SimpleChanges = {
                resetTrigger: new SimpleChange(false, true, false),
            };

            spyOn(component, 'sendInfoToMapCreationPage');
            component.ngOnChanges(changes);
            expect(gameObjectManagerServiceSpy.initObjectsArray).toHaveBeenCalled();
            expect(gameObjectManagerServiceSpy.resetObjectsCount).toHaveBeenCalled();
            expect(component.sendInfoToMapCreationPage).toHaveBeenCalled();
        });
    });

    describe('tile interactions', () => {
        it('should set tile to Ice when ice-tile is selected', () => {
            toolServiceSpy.getSelectedTile.and.returnValue('ice-tile');
            component.onTileClick(0, 0);
            expect(component.tilesGrid[0][0]).toBe(TileType.Ice);
        });

        it('should remove tile on right-click', () => {
            component.tilesGrid[0][0] = TileType.Wall;
            const event = new MouseEvent('click', { button: 2 });
            component.removeTile(event, 0, 0);
            expect(component.tilesGrid[0][0]).toBe(TileType.Ground);
        });

        it('should set tile to Ground when removing a non-Ground tile', () => {
            component.tilesGrid[0][0] = TileType.Wall;
            const event = new MouseEvent('click', { button: 0 });
            component.removeTile(event, 0, 0);
            expect(component.tilesGrid[0][0]).toBe(TileType.Ground);
        });

        it('should remove object if tile is a wall', () => {
            const mockGameObject = { id: 1, name: 'mock', description: 'mock game object for test', count: ITEM_COUNT, image: 'mock/image.png' };
            component.tilesGrid[MOCK_ROW][MOCK_COLUMN] = TileType.Wall;
            component.objectsArray = [
                [ObjectType.Armor, NO_OBJECT, NO_OBJECT, NO_OBJECT],
                [ObjectType.Armor, NO_OBJECT, NO_OBJECT, NO_OBJECT],
                [ObjectType.Armor, NO_OBJECT, NO_OBJECT, ObjectType.Armor],
                [ObjectType.Armor, NO_OBJECT, ObjectType.Armor, NO_OBJECT],
            ];
            gameObjectManagerServiceSpy.getGameObjectOnTile.and.returnValue(mockGameObject);
            component.onTileClick(MOCK_ROW, MOCK_COLUMN);

            expect(gameObjectManagerServiceSpy.selectedTile).toEqual({ row: MOCK_ROW, col: MOCK_COLUMN });
            expect(gameObjectManagerServiceSpy.removeObjectFromGrid).toHaveBeenCalledWith(mockGameObject);
        });
    });

    describe('mouse events', () => {
        it('should set isMouseDown to true on mouse down', () => {
            const event = new MouseEvent('mousedown', { button: 0 });
            component.onMouseDown(event, 0, 0);
            expect(component.isMouseDown).toBeTrue();
            expect(component.tilesGrid[0][0]).toBe(TileType.Ground);
        });

        it('should set isMouseDown to false on mouse up', () => {
            component.isMouseDown = true;
            component.onMouseUp();
            expect(component.isMouseDown).toBeFalse();
        });

        it('should trigger tile click on mouse move if mouse is down', () => {
            const event = new MouseEvent('mousedown', { button: 0 });
            component.onMouseDown(event, 0, 0);
            component.onMouseMove(0, 1);
            expect(component.tilesGrid[0][1]).toBe(TileType.Ground);
        });
    });

    describe('drag event', () => {
        it('should set dragStartPosition and draggedObject on drag start', () => {
            const mockDragEvent = new DragEvent('dragstart');

            gameObjectManagerServiceSpy.getGameObjectOnTile.and.returnValue(gameObjects[0]);
            component.onDragStart(mockDragEvent, MOCK_ROW, MOCK_COLUMN);

            expect(gameObjectManagerServiceSpy.dragStartPosition).toEqual({ row: MOCK_ROW, col: MOCK_COLUMN });
            expect(gameObjectManagerServiceSpy.getGameObjectOnTile).toHaveBeenCalledWith(MOCK_ROW, MOCK_COLUMN);
            expect(gameObjectManagerServiceSpy.draggedObject).toEqual(gameObjects[0]);
        });

        it('should prevent default behaviour on drag over ', () => {
            const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
            component.onDragOver(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should call event.preventDefault on drop when tile is invalid ', () => {
            const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
            spyOn(component, 'isValidTileForObject').and.returnValue(false);
            component.onDrop(mockEvent, MOCK_ROW, MOCK_COLUMN);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(gameObjectManagerServiceSpy.updateObjectGridPosition).not.toHaveBeenCalled();
        });

        it('should call updateObjectGridPosition on drop when tile is valid ', () => {
            const mockGameObject = { id: 1, name: 'mock', description: 'mock game object for test', count: ITEM_COUNT, image: 'mock/image.png' };
            const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
            spyOn(component, 'isValidTileForObject').and.returnValue(true);
            gameObjectManagerServiceSpy.draggedObject = mockGameObject;

            component.onDrop(mockEvent, MOCK_ROW, MOCK_COLUMN);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(gameObjectManagerServiceSpy.updateObjectGridPosition).toHaveBeenCalled();
        });

        it('should validate tile conditions correctly', () => {
            component.tilesGrid = [
                [TileType.Ground, TileType.Ice, TileType.ClosedDoor],
                [TileType.Wall, TileType.OpenDoor, TileType.Water],
            ];
            expect(component.isValidTileForObject(0, 0)).toBeTrue();
            expect(component.isValidTileForObject(0, 1)).toBeTrue();
            expect(component.isValidTileForObject(0, 2)).toBeFalse();
            expect(component.isValidTileForObject(1, 0)).toBeFalse();
            expect(component.isValidTileForObject(1, 1)).toBeFalse();
            expect(component.isValidTileForObject(1, 2)).toBeTrue();
        });
    });

    it('should return the correct image path for an existing object', () => {
        const mockGameObject = { id: 1, name: 'mock', description: 'mock game object for test', count: 5, image: 'mock/image.png' };
        gameObjectManagerServiceSpy.getObjectById.and.returnValue(mockGameObject);
        const result = component.getObjectImage(mockGameObject.id);
        expect(result).toBe(mockGameObject.image);
    });

    it('should return an empty string for a non-existing object', () => {
        gameObjectManagerServiceSpy.getObjectById.and.returnValue(undefined);
        const result = component.getObjectImage(NO_OBJECT);
        expect(result).toBe('');
    });

    it('should call toolService to reset selectedTile on destroy', () => {
        component.ngOnDestroy();
        expect(toolServiceSpy.selectedTile).toBe('');
    });

    it('should return early when mouse is down and previousRow and previousCol match', () => {
        component.isMouseDown = true;
        component.previousRow = 1;
        component.previousCol = 1;
        spyOn(component, 'onTileClick').and.callThrough();

        component.onTileClick(1, 1);
        expect(component.onTileClick).toHaveBeenCalledTimes(1);
    });

    it('should return early when mouse is down when dragging an object', () => {
        spyOn(component, 'onTileClick').and.callThrough();

        component.onTileClick(1, 1);
        expect(component.onTileClick).toHaveBeenCalledTimes(1);
    });

    it('should update object grid position when all conditions are met', () => {
        const mockRow = 0;
        const mockCol = 0;
        const mockGameObject = mockObjects[1];
        const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);

        gameObjectManagerServiceSpy.draggedObject = mockGameObject;
        spyOn(component, 'isValidTileForObject').and.returnValue(true);

        component.onDrop(mockEvent, mockRow, mockCol);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(gameObjectManagerServiceSpy.updateObjectGridPosition).toHaveBeenCalledWith(mockGameObject, mockRow, mockCol);
        expect(component.isMouseDown).toBeFalse();
        expect(toolServiceSpy.setSelectedTile).toHaveBeenCalledWith('');
    });

    it('should not update object grid position when the gameObject is null', () => {
        const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);

        component.objectsArray = [
            [NO_OBJECT, NO_OBJECT, NO_OBJECT],
            [NO_OBJECT, NO_OBJECT, NO_OBJECT],
            [NO_OBJECT, NO_OBJECT, NO_OBJECT],
        ];
        gameObjectManagerServiceSpy.draggedObject = null;
        spyOn(component, 'isValidTileForObject').and.returnValue(true);

        component.onDrop(mockEvent, MOCK_ROW, MOCK_COLUMN);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(gameObjectManagerServiceSpy.updateObjectGridPosition).not.toHaveBeenCalled();
        expect(component.isMouseDown).toBeFalse();
        expect(toolServiceSpy.setSelectedTile).toHaveBeenCalledWith('');
    });

    it('should not update object grid position when the tile is not empty', () => {
        const mockGameObject = { id: 1, name: 'mockObject', description: 'test object', count: 1, image: 'mock/image.png' };
        const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);

        component.objectsArray = [
            [NO_OBJECT, NO_OBJECT, NO_OBJECT],
            [NO_OBJECT, NO_OBJECT, NO_OBJECT],
            [ObjectType.Armor, NO_OBJECT, NO_OBJECT],
        ];
        gameObjectManagerServiceSpy.draggedObject = mockGameObject;
        spyOn(component, 'isValidTileForObject').and.returnValue(true);

        component.onDrop(mockEvent, MOCK_ROW, MOCK_COLUMN);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(gameObjectManagerServiceSpy.updateObjectGridPosition).not.toHaveBeenCalled();
        expect(component.isMouseDown).toBeFalse();
        expect(toolServiceSpy.setSelectedTile).toHaveBeenCalledWith('');
    });

    it('should not update object grid position when the tile is invalid', () => {
        const mockGameObject = { id: 1, name: 'mockObject', description: 'test object', count: 1, image: 'mock/image.png' };
        const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);

        component.objectsArray = [
            [NO_OBJECT, NO_OBJECT, NO_OBJECT],
            [NO_OBJECT, NO_OBJECT, NO_OBJECT],
            [NO_OBJECT, NO_OBJECT, NO_OBJECT],
        ];
        gameObjectManagerServiceSpy.draggedObject = mockGameObject;
        spyOn(component, 'isValidTileForObject').and.returnValue(false);

        component.onDrop(mockEvent, MOCK_ROW, MOCK_COLUMN);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(gameObjectManagerServiceSpy.updateObjectGridPosition).not.toHaveBeenCalled();
        expect(component.isMouseDown).toBeFalse();
        expect(toolServiceSpy.setSelectedTile).toHaveBeenCalledWith('');
    });

    it('should prevent default event behavior, call removeTile, and removeObjectByClick', () => {
        const mockEvent = new MouseEvent('contextmenu');
        spyOn(mockEvent, 'preventDefault');

        spyOn(component, 'removeTile');

        component.removeOnRightClick(mockEvent, 1, 1);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(component.removeTile).toHaveBeenCalledWith(mockEvent, 1, 1);
        expect(gameObjectManagerServiceSpy.removeObjectByClick).toHaveBeenCalledWith(mockEvent, 1, 1);
    });
});
