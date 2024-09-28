import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditionGameGridComponent } from './edition-game-grid.component';
import { ToolService } from '@app/services/tool.service';
import { MapValidatorService, TileType } from '@app/services/map-validator.service';
import { SimpleChanges, SimpleChange } from '@angular/core';

describe('EditionGameGridComponent', () => {
    let component: EditionGameGridComponent;
    let fixture: ComponentFixture<EditionGameGridComponent>;
    let toolServiceSpy: jasmine.SpyObj<ToolService>;
    let mapValidatorServiceSpy: jasmine.SpyObj<MapValidatorService>;

    beforeEach(async () => {
        toolServiceSpy = jasmine.createSpyObj('ToolService', ['getSelectedTile']);
        mapValidatorServiceSpy = jasmine.createSpyObj('MapValidatorService', ['validateMap']);

        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                { provide: ToolService, useValue: toolServiceSpy },
                { provide: MapValidatorService, useValue: mapValidatorServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EditionGameGridComponent);
        component = fixture.componentInstance;
        component.tilesGrid = component.createNewMap();
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
            expect(component.tilesGrid).toEqual(component.createNewMap());
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
            component.tilesGrid = component.createNewMap();
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
            component.resetGrid();
            expect(component.tilesGrid).toEqual(component.createNewMap());
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

    it('should call toolService to reset selectedTile on destroy', () => {
        component.ngOnDestroy();
        expect(toolServiceSpy.selectedTile).toBe('');
    });

    describe('getTileImage', () => {
        it('should return the correct image path for each tile type', () => {
            expect(component.getTileImage(TileType.Ground)).toBe('/assets/images/tiles/grass.jpg');
            expect(component.getTileImage(TileType.Ice)).toBe('/assets/images/tiles/ice.jpg');
            expect(component.getTileImage(TileType.Wall)).toBe('/assets/images/tiles/wall.jpg');
            expect(component.getTileImage(TileType.Water)).toBe('/assets/images/tiles/water.jpg');
            expect(component.getTileImage(TileType.ClosedDoor)).toBe('/assets/images/tiles/closed-door.jpg');
            expect(component.getTileImage(TileType.OpenDoor)).toBe('/assets/images/tiles/open-door.jpg');
            expect(component.getTileImage(0)).toBe('');
        });
    });
});
