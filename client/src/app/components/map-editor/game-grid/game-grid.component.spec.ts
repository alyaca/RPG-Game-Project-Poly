import { SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameObjectsContainerComponent } from '@app/components/map-editor/game-objects-container/game-objects-container.component';
import { NO_OBJECT, ObjectType, SIZE_SMALL_MAP, TileType } from '@app/constants';
import { mockObjects } from '@app/mocks/mock-object';
import { mockPlayers } from '@app/mocks/mock-players';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { MapValidatorService } from '@app/services/map-validator/map-validator.service';
import { TileService } from '@app/services/tile/tile.service';
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
    let tileServiceSpy: jasmine.SpyObj<TileService>;
    let gameObjectsContainerSpy: jasmine.SpyObj<GameObjectsContainerComponent>;

    beforeEach(async () => {
        tileServiceSpy = jasmine.createSpyObj('TileService', ['setTile', 'resetGrid', 'removeTile']);
        gameObjectsContainerSpy = jasmine.createSpyObj('GameObjectsContainerComponent', ['objects']);
        toolServiceSpy = jasmine.createSpyObj('ToolService', ['getSelectedTile', 'setSelectedTile', 'deactivateTileApplicator']);
        toolButtonServiceSpy = jasmine.createSpyObj('ToolButtonService', [], { selectedButton: null });
        mapValidatorServiceSpy = jasmine.createSpyObj('MapValidatorService', ['validateMap']);
        gameCreationServiceSpy = jasmine.createSpyObj('GameCreationService', ['updateDimensions']);
        gameObjectManagerServiceSpy = jasmine.createSpyObj('GameObjectService', [
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
            'checkGameObject',
            'onDrop',
            'handleGameObjectOnTile',
            'isValidTileForObject',
            'onDragStart',
            'objects',
        ]);

        tileServiceSpy.resetGrid.and.callFake((gridSize: number) => {
            return Array.from({ length: gridSize }, () => Array.from({ length: SIZE_SMALL_MAP }, () => TileType.Ground));
        });

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
                { provide: GameCreationService, useValue: gameCreationServiceSpy },
                { provide: TileService, useValue: tileServiceSpy },
                { provide: GameObjectsContainerComponent, useValue: gameObjectsContainerSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameGridComponent);
        component = fixture.componentInstance;
        gameObjectManagerServiceSpy.objects = mockObjects;
        gameObjectsContainerSpy.gameObjects = mockObjects;
        component.gridSize = SIZE_SMALL_MAP;
        component.tilesGrid = tileServiceSpy.resetGrid(component.gridSize, component.tilesGrid);
        component.objectsArray = gameObjectServiceMock.initObjectsArray();
        gameObjectManagerServiceSpy['gridSize'] = SIZE_SMALL_MAP;
        spyOn(component, 'sendInfoToMapCreationPage');
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize properties correctly', () => {
        expect(component.selectedRow).toBe(0);
        expect(component.selectedCol).toBe(0);
        expect(component.isMouseDown).toBeFalse();
    });

    it('should call getSelectedTile', () => {
        component.getSelectedTile();
        expect(toolServiceSpy.getSelectedTile).toHaveBeenCalled();
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
                [ObjectType.Armor, ObjectType.Armor],
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
                [ObjectType.Armor, ObjectType.Armor],
                [0, 0],
            ]);
            expect(gameObjectManagerServiceSpy.objectsArray).toEqual([
                [ObjectType.Armor, ObjectType.Armor],
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
            component.ngOnChanges(changes);
            expect(gameObjectManagerServiceSpy.initObjectsArray).toHaveBeenCalled();
            expect(gameObjectManagerServiceSpy.resetObjectsCount).toHaveBeenCalled();
            expect(component.sendInfoToMapCreationPage).toHaveBeenCalled();
        });
    });

    it('should call the methods to remove the tile on right click', () => {
        gameCreationServiceSpy.isModifiable = true;
        const event = new MouseEvent('click', { button: 2 });
        component.removeOnRightClick(event, 0, 0);
        expect(tileServiceSpy.removeTile).toHaveBeenCalled();
        expect(gameObjectManagerServiceSpy.removeObjectByClick).toHaveBeenCalledWith(event, 0, 0);
        expect(component.sendInfoToMapCreationPage).toHaveBeenCalled();
    });

    describe('mouse events', () => {
        it('should set isMouseDown to false on mouse up', () => {
            component.isMouseDown = true;
            component.onMouseUp();
            expect(component.isMouseDown).toBeFalse();
        });
    });

    describe('drag event', () => {
        // it('should set dragStartPosition and draggedObject on drag start', () => {
        //     gameCreationServiceSpy.isModifiable = true;
        //     gameObjectManagerServiceSpy.getGameObjectOnTile.and.returnValue(gameObjects[0]);
        //     component.onDragStart(MOCK_ROW, MOCK_COLUMN);

        //     expect(gameObjectManagerServiceSpy.dragStartPosition).toEqual({ row: MOCK_ROW, col: MOCK_COLUMN });
        //     expect(gameObjectManagerServiceSpy.getGameObjectOnTile).toHaveBeenCalledWith(MOCK_ROW, MOCK_COLUMN);
        //     expect(gameObjectManagerServiceSpy.draggedObject).toEqual(gameObjects[0]);
        // });

        it('should prevent default behaviour on drag over ', () => {
            const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
            component.onDragOver(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
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
        component.previousRow = 1;
        component.previousCol = 1;
        spyOn(component, 'onTileClick').and.callThrough();

        component.onTileClick(1, 1);
        expect(component.onTileClick).toHaveBeenCalledTimes(1);
    });

    it('onDragStart should call and set the correct methods', () => {
        component.isMouseDown = true;
        component.onDragStart(1, 1);
        expect(toolServiceSpy.deactivateTileApplicator).toHaveBeenCalled();
        expect(component.isMouseDown).toBeFalse();
        expect(gameObjectManagerServiceSpy.onDragStart).toHaveBeenCalled();
    });

    it('onDrop should call the correct methods', () => {
        component.isMouseDown = true;
        const mockEvent = new DragEvent('drop');
        component.onDrop(mockEvent, 1, 1);
        expect(gameObjectManagerServiceSpy.onDrop).toHaveBeenCalledWith(mockEvent, 1, 1, component.objectsArray, component.tilesGrid);
        expect(component.isMouseDown).toBeFalse();
        expect(toolServiceSpy.setSelectedTile).toHaveBeenCalledWith('');
        expect(component.sendInfoToMapCreationPage).toHaveBeenCalled();
    });

    it('should call isValidTileForObject when calling the component function', () => {
        component.tilesGrid = [
            [1, 1],
            [1, 1],
        ];
        component.isValidTileForObject(1, 1);
        expect(gameObjectManagerServiceSpy.isValidTileForObject).toHaveBeenCalledWith(1, 1, component.tilesGrid);
    });

    it('should not call the other methods if the condition is met in onTileClick', () => {
        component.isMouseDown = true;
        component.previousRow = 1;
        component.previousCol = 1;
        component.onTileClick(1, 1);
        expect(tileServiceSpy.setTile).not.toHaveBeenCalled();
        expect(gameObjectManagerServiceSpy.handleGameObjectOnTile).not.toHaveBeenCalled();
        expect(component.sendInfoToMapCreationPage).not.toHaveBeenCalled();
    });

    describe('onMouseDown and onMouseMove', () => {
        beforeEach(() => {
            spyOn(component, 'onTileClick');
        });

        it('should call onTileClick is button is 0', () => {
            component.isMouseDown = false;
            const mockEvent = new MouseEvent('click', { button: 0 });
            component.onMouseDown(mockEvent, 0, 0);
            expect(component.isMouseDown).toBeTrue();
            expect(component.onTileClick).toHaveBeenCalled();
        });

        it('should not call onTileClick if the event button is not 0', () => {
            component.isMouseDown = false;
            const mockEvent = new MouseEvent('click', { button: 1 });
            component.onMouseDown(mockEvent, 0, 0);
            expect(component.isMouseDown).toBeFalse();
            expect(component.onTileClick).not.toHaveBeenCalled();
        });

        it('should call onTileClick if isMouseDown is true', () => {
            component.isMouseDown = true;
            component.onMouseMove(0, 0);
            expect(component.onTileClick).toHaveBeenCalledWith(0, 0);
        });

        it('should not call onTileClick if isMouseDown is false', () => {
            component.isMouseDown = false;
            component.onMouseMove(0, 0);
            expect(component.onTileClick).not.toHaveBeenCalled();
        });
    });

    describe('spawn points update', () => {
        it('should call getPortraitId', () => {
            component.players = mockPlayers;
            spyOn(component, 'getPortraitId');
            component.displayPortraitOnSpawnPoints();
            expect(component.getPortraitId).toHaveBeenCalled();
        });

        it("should return the correct god's name", () => {
            const result = component.getPortraitId('Hestia');
            expect(result).toEqual(9);
        });

        it('should return the spawn point if note other god fits', () => {
            const result = component.getPortraitId('name');
            expect(result).toEqual(8);
        });
    });
});
