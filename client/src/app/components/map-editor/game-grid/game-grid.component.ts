import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameObjectComponent } from '@app/components/map-editor/game-object/game-object.component';
import { NO_OBJECT } from '@app/constants';
import { Map } from '@app/interfaces/map';
import { gameObjects } from '@app/objectsInfo';
import { GameCreationService } from '@app/services/game-creation.service';
import { GameGridService } from '@app/services/game-grid.service';
import { GameListService } from '@app/services/game-list.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { MapValidatorService, TileType } from '@app/services/map-validator/map-validator.service';
import { TileService } from '@app/services/tile/tile.service';
import { ToolService } from '@app/services/tool/tool.service';
@Component({
    selector: 'app-game-grid',
    standalone: true,
    imports: [GameObjectComponent],
    templateUrl: './game-grid.component.html',
    styleUrl: './game-grid.component.scss',
})
export class GameGridComponent implements OnChanges, OnDestroy, OnInit {
    @Input() selectedSize: string | null = null;
    @Input() resetTrigger: boolean = false;
    @Input() saveTrigger: boolean = false;

    @Input() mapName: string;
    @Input() mapDescription: string;

    @Output() gridChange = new EventEmitter<number[][]>();
    @Output() itemsChange = new EventEmitter<number[][]>();
    @Output() heightChange = new EventEmitter<number>();
    @Output() mapNameChange = new EventEmitter<string>();
    @Output() mapDescriptionChange = new EventEmitter<string>();

    tilesGrid: number[][];
    objectsArray: number[][];
    gridSize: number;
    isLoaded: boolean = false;
    selectedRow: number = 0;
    selectedCol: number = 0;
    hasMapToEdit: boolean = false;
    isMouseDown: boolean = false;
    originalMap: Readonly<Map>;
    currentMap: Map;
    previousRow: number | null = null;
    previousCol: number | null = null;

    constructor(
        private toolService: ToolService,
        private mapValidatorService: MapValidatorService,
        public tileService: TileService,
        private gameObjectService: GameObjectService,
        public gameListService: GameListService,
        private gameGridService: GameGridService,
        private gameCreationService: GameCreationService,
    ) {}

    ngOnInit() {
        this.gridSize = this.gameCreationService.updateDimensions() as number;
        this.tilesGrid = this.tileService.resetGrid(this.gridSize, this.tilesGrid);
        this.objectsArray = this.gameObjectService.createNewObjectsArray();

        if (this.gameGridService.hasMapToEditSubject) {
            this.loadMap(this.gameGridService.mapToEdit);
        } else {
            console.log('No map available for editing');
        }
    }

    get selectedTile(): string {
        return this.toolService.getSelectedTile();
    }

    loadMap(mapToEdit: Map) {
        if (mapToEdit) {
            this.originalMap = JSON.parse(JSON.stringify(mapToEdit));
            this.currentMap = JSON.parse(JSON.stringify(this.originalMap));
            this.gridSize = this.currentMap.dimension;
            this.reloadMap();
            this.sendInfoToMapCreationPage();
        } else {
            console.error('Invalid map provided for loading');
        }
    }

    reloadMap() {
        if (this.originalMap) {
            this.tilesGrid = this.currentMap.tiles;
            this.objectsArray = this.currentMap.itemPlacement;
            this.mapDescription = this.currentMap.description;
            this.mapName = this.currentMap.name;
            this.gameObjectService.updateObjectsContainer(this.objectsArray, gameObjects);
            setTimeout(() => {
                this.mapDescriptionChange.emit(this.mapDescription);
                this.mapNameChange.emit(this.mapName);
            });
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.resetTrigger && changes.resetTrigger.previousValue === false && changes.resetTrigger.currentValue === true) {
            if (this.gameGridService.hasMapToEditSubject) {
                this.currentMap = JSON.parse(JSON.stringify(this.originalMap));
                this.reloadMap();
            } else {
                this.tilesGrid = this.tileService.resetGrid(this.gridSize, this.tilesGrid);
                this.objectsArray = this.gameObjectService.createNewObjectsArray();
            }

            this.sendInfoToMapCreationPage();
        }
        if (changes.saveTrigger && this.saveTrigger) {
            this.mapValidatorService.validateMap(this.tilesGrid, this.mapName, this.mapDescription);
            this.sendInfoToMapCreationPage();
        }
    }

    sendInfoToMapCreationPage() {
        this.gridChange.emit(this.tilesGrid);
        this.itemsChange.emit(this.objectsArray);
        this.heightChange.emit(this.gridSize);
    }

    onDragStart(event: DragEvent, row: number, col: number) {
        this.toolService.deactivateTileApplicator();
        this.gameObjectService.selectedTile = null;
        this.isMouseDown = false;
        this.gameObjectService.dragStartPosition = { row, col };
        const gameObject = this.gameObjectService.getGameObjectOnTile(row, col);
        if (gameObject) {
            this.gameObjectService.draggedObject = gameObject;
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent, row: number, col: number) {
        event.preventDefault();
        const gameObject = this.gameObjectService.draggedObject;
        if (gameObject && this.objectsArray[row][col] === NO_OBJECT && this.isValidTileForObject(row, col)) {
            this.gameObjectService.updateObjectGridPosition(gameObject, row, col, this.objectsArray);
        }
        this.isMouseDown = false;
        this.toolService.setSelectedTile('');
        this.sendInfoToMapCreationPage();
    }

    isValidTileForObject(row: number, col: number): boolean {
        const validTileType = [TileType.Ground, TileType.Ice, TileType.Water];
        return validTileType.includes(this.tilesGrid[row][col]);
    }

    getObjectImage(id: number): string {
        const gameObject = this.gameObjectService.getObjectById(id);
        if (gameObject) {
            return gameObject.image;
        }
        return '';
    }

    removeOnRightClick(event: MouseEvent, row: number, col: number) {
        event.preventDefault();
        this.removeTile(event, row, col);
        this.gameObjectService.removeObjectByClick(event, row, col);
        this.sendInfoToMapCreationPage();
    }

    onTileClick(row: number, col: number) {
        if (this.isMouseDown && this.previousRow === row && this.previousCol === col) {
            return;
        }

        this.selectedRow = row;
        this.selectedCol = col;
        this.tileService.setTile(this.selectedTile, row, col, this.tilesGrid);

        const gameObject = this.gameObjectService.getGameObjectOnTile(row, col);
        if (gameObject && gameObject?.id !== 0 && !this.isValidTileForObject(row, col)) {
            this.gameObjectService.selectedTile = { row, col };
            this.gameObjectService.removeObjectFromGrid(gameObject);
        }
        this.previousRow = row;
        this.previousCol = col;
        this.sendInfoToMapCreationPage();
    }

    onMouseDown(event: MouseEvent, row: number, col: number) {
        if (event.button === 0) {
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
        if (this.isMouseDown) {
            this.onTileClick(row, col);
        }
    }

    ngOnDestroy() {
        this.toolService.selectedTile = '';
        this.gameGridService.hasMapToEditSubject = false;
    }

    removeTile(event: MouseEvent, row: number, col: number) {
        event.preventDefault();
        if (this.tilesGrid[row][col] !== TileType.Ground && this.objectsArray[row][col] === NO_OBJECT) {
            this.tilesGrid[row][col] = TileType.Ground;
        }
    }
}
