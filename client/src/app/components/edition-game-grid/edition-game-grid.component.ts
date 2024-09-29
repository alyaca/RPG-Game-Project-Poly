import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { GameObjectComponent } from '@app/components/game-object/game-object.component';
import { NO_OBJECT, SIZE_SMALL_MAP } from '@app/constants';
import { GameObjectManagerService } from '@app/services/game-object-manager/game-object-manager.service';
import { MapValidatorService, TileType } from '@app/services/map-validator/map-validator.service';
import { TileService } from '@app/services/tile/tile.service';
import { ToolService } from '@app/services/tool.service';

@Component({
    selector: 'app-edition-game-grid',
    standalone: true,
    imports: [GameObjectComponent],
    templateUrl: './edition-game-grid.component.html',
    styleUrl: './edition-game-grid.component.scss',
})
export class EditionGameGridComponent implements OnChanges, OnDestroy {
    @Input() selectedSize: string;
    @Input() resetTrigger: boolean = false;
    @Input() saveTrigger: boolean = false;

    @Input() mapName: string;
    @Input() mapDescription: string;

    tilesGrid: number[][];
    height: number = SIZE_SMALL_MAP;
    width: number = SIZE_SMALL_MAP;

    selectedRow: number = 0;
    selectedCol: number = 0;

    isMouseDown: boolean = false;
    isDraggingObject: boolean = false;
    objectsArray: number[][];

    previousRow: number | null = null;
    previousCol: number | null = null;

    tempSelectedTile: string | null = null;

    constructor(
        private toolService: ToolService,
        private mapValidatorService: MapValidatorService,
        public tileService: TileService,
        private gameObjectManagerService: GameObjectManagerService,
    ) {
        this.gameObjectManagerService.initObjectsArray(this.height);
        this.objectsArray = this.gameObjectManagerService.objectsArray;
        this.tilesGrid = this.tileService.resetGrid(this.height, this.tilesGrid);
    }

    get selectedTile(): string {
        return this.toolService.getSelectedTile();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.resetTrigger && changes.resetTrigger.previousValue === false && changes.resetTrigger.currentValue === true) {
            this.tilesGrid = this.tileService.resetGrid(this.height, this.tilesGrid);
            this.objectsArray = this.gameObjectManagerService.initObjectsArray(this.height);
            this.gameObjectManagerService.resetObjectsCount();
        }
        if (changes.saveTrigger && this.saveTrigger) {
            this.mapValidatorService.validateMap(this.tilesGrid, this.mapName, this.mapDescription);
        }
    }

    onDragStart(event: DragEvent, row: number, col: number) {
        this.isDraggingObject = true;
        this.tempSelectedTile = this.toolService.getSelectedTile();
        this.toolService.setSelectedTile("");

        this.isMouseDown = false;
        this.gameObjectManagerService.dragStartPosition = { row, col };
        const gameObject = this.gameObjectManagerService.getGameObjectOnTile(row, col);
        if (gameObject) {
            this.gameObjectManagerService.draggedObject = gameObject;
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent, row: number, col: number) {
        event.preventDefault();
        const gameObject = this.gameObjectManagerService.draggedObject;
        if (gameObject && this.objectsArray[row][col] === NO_OBJECT && this.isValidTileForObject(row, col)) {
            this.gameObjectManagerService.updateObjectGridPosition(gameObject, row, col);
        }
        this.isMouseDown = false;
        this.isDraggingObject = false;
    }

    isValidTileForObject(row: number, col: number): boolean {
        const validTileType = [TileType.Ground, TileType.Ice, TileType.Water];
        return validTileType.includes(this.tilesGrid[row][col]);
    }

    getObjectImage(id: number): string {
        const gameObject = this.gameObjectManagerService.getObjectById(id);
        if (gameObject) {
            return gameObject.image;
        }
        return '';
    }

    removeOnRightClick(event: MouseEvent, row: number, col: number) {
        event.preventDefault();
        this.removeTile(event, row, col);
        this.gameObjectManagerService.removeObjectByClick(event, row, col);
    }

    onTileClick(row: number, col: number) {
        if (this.isDraggingObject) return;
        if (this.isMouseDown && this.previousRow === row && this.previousCol === col) {
            return;
        }

        this.selectedRow = row;
        this.selectedCol = col;
        this.tileService.setTile(this.selectedTile, row, col, this.tilesGrid);

        const gameObject = this.gameObjectManagerService.getGameObjectOnTile(row, col);
        if (gameObject && gameObject?.id !== 0 && !this.isValidTileForObject(row, col)) {
            this.gameObjectManagerService.selectedTile = { row, col };
            this.gameObjectManagerService.removeObjectFromGrid(gameObject);
        }
        
        this.previousRow = row;
        this.previousCol = col;
    }

    onMouseDown(event: MouseEvent, row: number, col: number) {
        if (event.button === 0 && !this.isDraggingObject) {
            this.isMouseDown = true;
            this.onTileClick(row, col);
        }
    }

    onMouseUp() {
        this.isMouseDown = false;
        this.previousRow = null;
        this.previousCol = null;
    }

    onMouseMove(row: number, col: number) {
        if (this.isMouseDown && !this.isDraggingObject) {
            this.onTileClick(row, col);
        }
    }

    ngOnDestroy() {
        this.toolService.selectedTile = '';
    }

    removeTile(event: MouseEvent, row: number, col: number) {
        event.preventDefault();
        if (this.tilesGrid[row][col] !== TileType.Ground && this.objectsArray[row][col] === NO_OBJECT) {
            this.tilesGrid[row][col] = TileType.Ground;
        }
    }
}

