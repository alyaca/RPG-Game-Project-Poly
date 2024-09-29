import { SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_OBJECT, ObjectType } from '@app/constants';
import { mockObjects } from '@app/mocks/mock-object';
import { gameObjects } from '@app/objectsInfo';
import { GameObjectManagerService } from '@app/services/game-object-manager/game-object-manager.service';
import { MapValidatorService, TileType } from '@app/services/map-validator/map-validator.service';
import { ToolService } from '@app/services/tool.service';
import { EditionGameGridComponent } from './edition-game-grid.component';

describe('EditionGameGridComponent', () => {
    let component: EditionGameGridComponent;
    let fixture: ComponentFixture<EditionGameGridComponent>;
    let toolServiceSpy: jasmine.SpyObj<ToolService>;
    let mapValidatorServiceSpy: jasmine.SpyObj<MapValidatorService>;
    let gameObjectManagerServiceSpy: jasmine.SpyObj<GameObjectManagerService>;

    beforeEach(async () => {
        toolServiceSpy = jasmine.createSpyObj('ToolService', ['getSelectedTile']);
        mapValidatorServiceSpy = jasmine.createSpyObj('MapValidatorService', ['validateMap']);
        gameObjectManagerServiceSpy = jasmine.createSpyObj('GameObjectManagerService', [
            'initObjectsArray',
            'getObjectById',
            'getGameObjectOnTile',
            'updateObjectGridPosition',
            'removeObjectFromGrid',
            'removeObjectByClick',
            'resetDrag,',
        ]);

        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                { provide: ToolService, useValue: toolServiceSpy },
                { provide: MapValidatorService, useValue: mapValidatorServiceSpy },
                { provide: GameObjectManagerService, useValue: gameObjectManagerServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EditionGameGridComponent);
        component = fixture.componentInstance;
        component.tilesGrid = component.tileService.resetGrid(component.height, component.tilesGrid);
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
            expect(component.tilesGrid).toEqual(component.tileService.resetGrid(component.height, component.tilesGrid));
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
        beforeEach(() => {
            component.tilesGrid = component.tileService.resetGrid(component.height, component.tilesGrid);
        });

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
            expect(component.tilesGrid).toEqual(component.tileService.resetGrid(component.height, component.tilesGrid));
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
            const mockRow = 0;
            const mockCol = 0;
            component.tilesGrid[0][0] = TileType.Wall;
            component.objectsArray = [
                [ObjectType.Armor, NO_OBJECT],
                [ObjectType.Lightning, NO_OBJECT],
            ];
            gameObjectManagerServiceSpy.getGameObjectOnTile.and.returnValue(mockObjects[0]);
            component.onTileClick(mockRow, mockCol);

            expect(gameObjectManagerServiceSpy.selectedTile).toEqual({ row: mockRow, col: mockCol });
            expect(gameObjectManagerServiceSpy.removeObjectFromGrid).toHaveBeenCalledWith(mockObjects[0]);
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
            const mockRow = 2;
            const mockCol = 3;
            const mockDragEvent = new DragEvent('dragstart');

            gameObjectManagerServiceSpy.getGameObjectOnTile.and.returnValue(gameObjects[0]);
            component.onDragStart(mockDragEvent, mockRow, mockCol);

            expect(gameObjectManagerServiceSpy.dragStartPosition).toEqual({ row: mockRow, col: mockCol });
            expect(gameObjectManagerServiceSpy.getGameObjectOnTile).toHaveBeenCalledWith(mockRow, mockCol);
            expect(gameObjectManagerServiceSpy.draggedObject).toEqual(gameObjects[0]);
        });

        it('should call event.preventDefault on drag over ', () => {
            const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
            component.onDragOver(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should call event.preventDefault on drop when tile is invalid ', () => {
            const mockRow = 2;
            const mockCol = 3;
            const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
            spyOn(component, 'isValidTileForObject').and.returnValue(false);
            component.onDrop(mockEvent, mockRow, mockCol);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(gameObjectManagerServiceSpy.updateObjectGridPosition).not.toHaveBeenCalled();
        });

        it('should call updateObjectGridPosition on drop when tile is valid ', () => {
            const mockRow = 2;
            const mockCol = 3;
            const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
            spyOn(component, 'isValidTileForObject').and.returnValue(true);
            gameObjectManagerServiceSpy.draggedObject = mockObjects[0];

            component.onDrop(mockEvent, mockRow, mockCol);

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(gameObjectManagerServiceSpy.updateObjectGridPosition).toHaveBeenCalled();
        });

        it('should validate tile conditions correctly', () => {
            component.tilesGrid = [
                [TileType.Ground, TileType.Ice, TileType.ClosedDoor],
                [TileType.Wall, TileType.OpenDoor, TileType.Water],
            ];
            expect(component.isValidTileForObject(0, 0)).toBeTrue(); // Ground tile
            expect(component.isValidTileForObject(0, 1)).toBeTrue(); // Ice tile
            expect(component.isValidTileForObject(0, 2)).toBeFalse(); // ClosedDoor tile
            expect(component.isValidTileForObject(1, 0)).toBeFalse(); // Wall tile
            expect(component.isValidTileForObject(1, 1)).toBeFalse(); // OpenDoor tile
            expect(component.isValidTileForObject(1, 2)).toBeTrue(); // Water tile
        });
    });

    it('should return the correct image path for an existing object', () => {
        gameObjectManagerServiceSpy.getObjectById.and.returnValue(mockObjects[0]);
        const result = component.getObjectImage(mockObjects[0].id);
        expect(result).toBe(mockObjects[0].image);
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
});
