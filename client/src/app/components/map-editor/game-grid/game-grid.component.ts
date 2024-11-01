import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameObjectComponent } from '@app/components/map-editor/game-object/game-object.component';
import { NO_OBJECT } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { MapValidatorService } from '@app/services/map-validator/map-validator.service';
import { NavigationService } from '@app/services/navigation.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { TileService } from '@app/services/tile/tile.service';
import { ToolService } from '@app/services/tool/tool.service';
import { Game } from '@common/game';
import { Player, Position } from '@common/player';

@Component({
    selector: 'app-game-grid',
    standalone: true,
    imports: [GameObjectComponent],
    templateUrl: './game-grid.component.html',
    styleUrl: './game-grid.component.scss',
})
export class GameGridComponent implements OnInit, OnChanges, OnDestroy {
    @Input() selectedSize: string | null = null;
    @Input() resetTrigger: boolean = false;
    @Input() saveTrigger: boolean = false;

    @Input() mapName: string;
    @Input() mapDescription: string;

    @Output() gridChange = new EventEmitter<number[][]>();
    @Output() itemsChange = new EventEmitter<number[][]>();
    @Output() heightChange = new EventEmitter<number>();

    oldMapName: string;

    tilesGrid: number[][];
    objectsArray: number[][];
    gridSize: number;
    players: Player[] = [];
    currentPlayer: Player;

    selectedRow: number = 0;
    selectedCol: number = 0;

    isMouseDown: boolean = false;

    previousRow: number | null = null;
    previousCol: number | null = null;
    gameMap: Game;

    // Not sure
    reachableTiles: Position[] = [];
    fastestPath: Position[] | null = [];
    isMoving: boolean = false;

    constructor(
        private toolService: ToolService,
        private mapValidatorService: MapValidatorService,
        public tileService: TileService,
        public gameObjectService: GameObjectService,
        private gameCreationService: GameCreationService,
        private socketCommunicationService: SocketCommunicationService,
        private navigationService: NavigationService,
    ) {}

    getSelectedTile(): string {
        return this.toolService.getSelectedTile();
    }

    ngOnInit() {
        if (!this.socketCommunicationService.isSocketAlive()) {
            this.socketCommunicationService.connect();
        }
        this.gridSize = this.gameCreationService.updateDimensions() as number;
        if (this.gameCreationService.isNewGame) {
            this.loadNewGame();
        } else {
            this.loadExistingGame();
        }
    }

    loadNewGame() {
        this.objectsArray = this.gameObjectService.initObjectsArray();
        this.tilesGrid = this.tileService.resetGrid(this.gridSize, this.tilesGrid);
    }

    loadExistingGame() {
        this.tilesGrid = this.deepCopyMatrix(this.gameCreationService.loadedTiles);
        this.objectsArray = this.deepCopyMatrix(this.gameCreationService.loadedObjects);
        this.gameObjectService.objectsArray = this.objectsArray;
        this.oldMapName = this.gameCreationService.loadedMapName;
    }

    deepCopyMatrix(matrix: number[][] | null): number[][] {
        if (!matrix) {
            return [];
        }
        return JSON.parse(JSON.stringify(matrix));
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!changes.resetTrigger?.previousValue && changes.resetTrigger?.currentValue) {
            this.onResetTrigger();
        }
        if (changes.saveTrigger && this.saveTrigger) {
            this.mapValidatorService.validateMap(
                this.tilesGrid,
                this.mapName,
                this.mapDescription,
                this.gameCreationService.isNewGame,
                this.oldMapName,
            );
        }
        this.sendInfoToMapCreationPage();
    }

    onResetTrigger() {
        if (!this.gameCreationService.isNewGame) {
            this.resetNewMap();
        } else {
            this.resetExistingMap();
        }
    }

    resetNewMap() {
        this.tilesGrid = this.deepCopyMatrix(this.gameCreationService.loadedTiles);
        this.objectsArray = this.deepCopyMatrix(this.gameCreationService.loadedObjects);
        this.gameObjectService.objectsArray = this.objectsArray;
        this.gameObjectService.loadMapObjectCount();
    }

    resetExistingMap() {
        this.objectsArray = this.gameObjectService.initObjectsArray();
        this.gameObjectService.resetObjectsCount();
        this.tilesGrid = this.tileService.resetGrid(this.gridSize, this.tilesGrid);
    }

    sendInfoToMapCreationPage() {
        this.gridChange.emit(this.tilesGrid);
        this.itemsChange.emit(this.objectsArray);
        this.heightChange.emit(this.gridSize);
    }

    onDragStart(row: number, col: number) {
        this.gameObjectService.onDragStart(row, col);
        this.toolService.deactivateTileApplicator();
        this.isMouseDown = false;
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent, row: number, col: number) {
        this.gameObjectService.onDrop(event, row, col, this.objectsArray, this.tilesGrid);
        this.isMouseDown = false;
        this.toolService.setSelectedTile('');
        this.sendInfoToMapCreationPage();
    }

    isValidTileForObject(row: number, col: number): boolean {
        return this.gameObjectService.isValidTileForObject(row, col, this.tilesGrid);
    }

    getObjectImage(id: number): string {
        const gameObject = this.gameObjectService.getObjectById(id);
        return gameObject ? gameObject.image : '';
    }

    removeOnRightClick(event: MouseEvent, row: number, col: number) {
        this.tilesGrid = this.tileService.removeTile(event, row, col, this.tilesGrid, this.objectsArray);
        this.gameObjectService.removeObjectByClick(event, row, col);
        this.sendInfoToMapCreationPage();
    }

    onTileClick(row: number, col: number) {
        if (this.isMouseDown && this.previousRow === row && this.previousCol === col) {
            return;
        }
        this.tileService.setTile(this.getSelectedTile(), row, col, this.tilesGrid);
        this.gameObjectService.handleGameObjectOnTile(row, col, this.tilesGrid);
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
    }

    removeTile(event: MouseEvent, row: number, col: number) {
        event.preventDefault();
        if (this.tilesGrid[row][col] !== TileType.Ground && this.objectsArray[row][col] === NO_OBJECT) {
            this.tilesGrid[row][col] = TileType.Ground;
        }
    }

    isReachableTile(row: number, col: number): boolean {
        return this.reachableTiles.some((tile) => tile.x === row && tile.y === col);
    }
    /*
    onHover(row: number, col: number) {
        this.fastestPath = this.navigationService.findFastestPath(this.players[0], { x: row, y: col }, this.gameMap);
    }
        */
    /*
    isOnFastestPath(row: number, col: number): boolean {
        if (!this.fastestPath) {
            return false;
        }
        return this.fastestPath.some((tile) => tile.x === row && tile.y === col);
    }
        */

    private isPositionWithinBounds(x: number, y: number, array: number[][]): boolean {
        return x >= 0 && y >= 0 && x < array.length && y < array[0].length;
    }

    private updateSelectedTile(row: number, col: number) {
        this.selectedRow = row;
        this.selectedCol = col;
        this.tileService.setTile(this.selectedTile, row, col, this.tilesGrid);
    }

    private handleGameObjectOnTile(row: number, col: number) {
        const gameObject = this.gameObjectService.getGameObjectOnTile(row, col);
        if (gameObject && gameObject?.id !== 0 && !this.isValidTileForObject(row, col)) {
            this.gameObjectService.selectedTile = { row, col };
            this.gameObjectService.removeObjectFromGrid(gameObject);
        }
    }

    private findReachableTiles() {
        this.reachableTiles = [];
        this.reachableTiles = this.navigationService.findReachableTiles(this.players[0], this.gameMap, this.players[0].attributes.movementPointsLeft);
    }
    /*
    isReachableTile(row: number, col: number): boolean {
        return this.reachableTiles.some((tile) => tile.x === row && tile.y === col);
    }
        */

    findPath(row: number, col: number) {
        if (this.isReachableTile(row, col)) {
            this.fastestPath = this.navigationService.findFastestPath(this.players[0], { x: row, y: col }, this.gameMap);
        }
    }

    isOnFastestPath(row: number, col: number): boolean {
        if (!this.fastestPath) {
            return false;
        }
        return this.fastestPath.some((tile) => tile.x === row && tile.y === col);
    }

    print() {
        console.log('PPPPPPP');
    }

    //A deplacer dans le service de navigation
    /*
    async navigateToTile(row: number, col: number) {
        if (this.isReachableTile(row, col) && !this.isMoving) {
            this.findPath(row, col);

            if (this.fastestPath && this.fastestPath.length > 0) {
                this.isMoving = true;
                for (const tile of this.fastestPath) {
                    const currentPosition = this.players[0].position;
                    //TODO : replacer point de depart, si il y en avait avant
                    this.objectsArray[currentPosition.x][currentPosition.y] = 0;
                    this.players[0].position = { x: tile.x, y: tile.y };
                    //this.objectsArray[tile.x][tile.y] = 1;
                    this.displayPortraitOnSpawnPoints();
                    this.findReachableTiles();
                    await this.delay(150);
                }
            }
            this.isMoving = false;
        }
    }
        */

    async navigateToTile(row: number, col: number) {
        //Temporaire , peut etre il faut le deplacer au backend
        if (!this.isMoving) {
            const path = this.navigationService.navigateToTile(this.players[0], { x: row, y: col }, this.gameMap);
            let currentPosition = this.players[0].position;
            for (const tile of path) {
                this.isMoving = true;
                //TODO : replacer point de depart, si il y en avait avant
                this.objectsArray[currentPosition.x][currentPosition.y] = 0;
                this.players[0].position = { x: tile.x, y: tile.y };
                //this.objectsArray[tile.x][tile.y] = 1;
                this.displayPortraitOnSpawnPoints();
                //verifaication de 10%:
                this.findReachableTiles();
                currentPosition = this.players[0].position;
                if (this.gameMap.tiles[currentPosition.x][currentPosition.y] === TileType.Ice) {
                    if (!this.checkFell()) {
                        //Est ce que c'est comme ca qu'on envoie le message?
                        this.socketCommunicationService.send('playerFell', this.players[0]);
                        //Todo affichage de message de TOMBER
                        break;
                    }
                }
                await this.delay(150); //Constant
            }
            this.isMoving = false;
        }
    }
    checkFell(): boolean {
        const randomValue = Math.random();
        return randomValue > 0.1;
    }

    delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
