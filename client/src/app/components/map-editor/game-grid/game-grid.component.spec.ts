import { SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ITEM_COUNT, NO_OBJECT, ObjectType, SIZE_SMALL_MAP } from '@app/constants';
import { mockObjects } from '@app/mocks/mock-object';
import { MOCK_COLUMN, MOCK_ROW } from '@app/mocks/mock-position';
import { gameObjects } from '@app/objectsInfo';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { MapValidatorService, TileType } from '@app/services/map-validator/map-validator.service';
import { ToolButtonService } from '@app/services/tool-button/tool-button.service';
import { ToolService } from '@app/services/tool/tool.service';
import { GameGridComponent } from './game-grid.component';
import { HttpClient } from '@angular/common/http';
import { dummyMap } from '@app/mocks/mock-map';

describe('GameGridComponent', () => {
    let component: GameGridComponent;
    let fixture: ComponentFixture<GameGridComponent>;
    let toolServiceSpy: jasmine.SpyObj<ToolService>;
    let mapValidatorServiceSpy: jasmine.SpyObj<MapValidatorService>;
    let gameObjectManagerServiceSpy: jasmine.SpyObj<GameObjectService>;
    let toolButtonServiceSpy: jasmine.SpyObj<ToolButtonService>;
    let httpClientSpy: jasmine.SpyObj<ToolButtonService>;

    beforeEach(async () => {
        toolServiceSpy = jasmine.createSpyObj('ToolService', ['getSelectedTile', 'setSelectedTile', 'deactivateTileApplicator']);
        toolButtonServiceSpy = jasmine.createSpyObj('ToolButtonService', [], { selectedButton: null });
        mapValidatorServiceSpy = jasmine.createSpyObj('MapValidatorService', ['validateMap']);
        gameObjectManagerServiceSpy = jasmine.createSpyObj('GameObjectManagerService', [
            'createNewObjectsArray',
            'getObjectById',
            'getGameObjectOnTile',
            'updateObjectGridPosition',
            'removeObjectFromGrid',
            'removeObjectByClick',
            'resetDrag,',
            'resetObjectsCount',
            'updateObjectsContainer',
        ]);
        gameObjectManagerServiceSpy.createNewObjectsArray.and.returnValue([]);

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
            imports: [],
            declarations: [],
            providers: [
                { provide: ToolService, useValue: toolServiceSpy },
                { provide: ToolButtonService, useValue: toolButtonServiceSpy },
                { provide: MapValidatorService, useValue: mapValidatorServiceSpy },
                { provide: GameObjectService, useValue: gameObjectManagerServiceSpy },
                { provide: 'TileService', useValue: tileServiceMock },
                { provide: HttpClient, useValue: httpClientSpy },
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

    describe('ngOnChanges', () => {
        it('should reset the grid when resetTrigger changes to true', () => {
            component.tilesGrid[0][0] = TileType.Water;
            const changes: SimpleChanges = {
                resetTrigger: new SimpleChange(false, true, false),
            };

            component.ngOnChanges(changes);
            expect(component.tilesGrid).toEqual(component.tileService.resetGrid(component.gridSize, component.tilesGrid));
        });

        it('should validate the map when saveTrigger changes to true', () => {
            component.mapName = 'Test Map';
            component.mapDescription = 'Description';
            component.tilesGrid = [[TileType.Ground]];
            const changes: SimpleChanges = {
                saveTrigger: new SimpleChange(false, true, false),
            };
            component.saveTrigger = true;
            component.ngOnChanges(changes);
            expect(mapValidatorServiceSpy.validateMap).toHaveBeenCalledWith(component.tilesGrid, component.mapName, component.mapDescription);
        });
    });

    describe('tile interactions', () => {
        it('should set tile to Ice when ice-tile is selected', () => {
            toolServiceSpy.getSelectedTile.and.returnValue('ice-tile');
            component.onTileClick(0, 0);
            expect(component.tilesGrid[0][0]).toBe(TileType.Ice);
        });

        it('should set tile to Wall when wall-tile is selected', () => {
            toolServiceSpy.getSelectedTile.and.returnValue('wall-tile');
            component.onTileClick(0, 0);
            expect(component.tilesGrid[0][0]).toBe(TileType.Wall);
        });

        it('should set tile to Water when water-tile is selected', () => {
            toolServiceSpy.getSelectedTile.and.returnValue('water-tile');
            component.onTileClick(0, 0);
            expect(component.tilesGrid[0][0]).toBe(TileType.Water);
        });

        it('should set tile to ClosedDoor when door-tile is selected and on edge', () => {
            toolServiceSpy.getSelectedTile.and.returnValue('door-tile');
            component.tilesGrid[1][1] = TileType.Ground;
            component.onTileClick(1, 1);
            expect(component.tilesGrid[1][1]).toBe(TileType.ClosedDoor);
        });

        it('should reset the grid', () => {
            expect(component.tilesGrid).toEqual(component.tileService.resetGrid(component.gridSize, component.tilesGrid));
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
        const mockArray = component.objectsArray;
        const mockGameObject = mockObjects[1];
        const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);

        gameObjectManagerServiceSpy.draggedObject = mockGameObject;
        spyOn(component, 'isValidTileForObject').and.returnValue(true);

        component.onDrop(mockEvent, mockRow, mockCol);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(gameObjectManagerServiceSpy.updateObjectGridPosition).toHaveBeenCalledWith(mockGameObject, mockRow, mockCol, mockArray);
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

    it('should set the tile to Ground when conditions are met', () => {
        component.tilesGrid[1][0] = TileType.Wall;
        component.objectsArray[1][0] = NO_OBJECT;
        const mockEvent = new MouseEvent('click', { button: 0 });
        spyOn(mockEvent, 'preventDefault');

        component.removeTile(mockEvent, 1, 0);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(component.tilesGrid[1][0]).toBe(TileType.Ground);
    });

    it('should not change the tile if it is already Ground', () => {
        const mockEvent = new MouseEvent('click');
        spyOn(mockEvent, 'preventDefault');

        component.tilesGrid[0][0] = TileType.Ground;
        component.objectsArray[0][0] = NO_OBJECT;
        component.removeTile(mockEvent, 0, 0);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(component.tilesGrid[0][0]).toBe(TileType.Ground);
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

    it('should load a valid map and call reloadMap', () => {
        spyOn(component, 'reloadMap').and.callThrough();
        spyOn(component, 'sendInfoToMapCreationPage');

        component.loadMap(dummyMap);

        const actualModificationTime = new Date(component.currentMap.lastModification).toISOString();
        const expectedModificationTime = new Date(dummyMap.lastModification).toISOString();
        expect(actualModificationTime).toEqual(expectedModificationTime);

        expect(component.reloadMap).toHaveBeenCalled();
        expect(component.sendInfoToMapCreationPage).toHaveBeenCalled();
    });

    it('should reload the map and emit name and description change', (done) => {
        component.currentMap = dummyMap;
        component.originalMap = dummyMap;

        spyOn(component.mapDescriptionChange, 'emit');
        spyOn(component.mapNameChange, 'emit');

        component.reloadMap();
        expect(component.tilesGrid).toEqual(dummyMap.tiles);
        expect(component.objectsArray).toEqual(dummyMap.itemPlacement);
        expect(component.mapDescription).toBe(dummyMap.description);
        expect(component.mapName).toBe(dummyMap.name);

        expect(gameObjectManagerServiceSpy.updateObjectsContainer).toHaveBeenCalled();

        setTimeout(() => {
            expect(component.mapDescriptionChange.emit).toHaveBeenCalledWith(dummyMap.description);
            expect(component.mapNameChange.emit).toHaveBeenCalledWith(dummyMap.name);
            done();
        }, 0);
    });
});
