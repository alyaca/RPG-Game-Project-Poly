import { Component, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameObjectComponent } from '@app/components/map-editor/game-object/game-object.component';
import { NAVIGATION_DELAY, NO_OBJECT, ObjectType, TileType } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { MapValidatorService } from '@app/services/map-validator/map-validator.service';
import { NavigationService } from '@app/services/navigation.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { TileService } from '@app/services/tile/tile.service';
import { ToolService } from '@app/services/tool/tool.service';
import { Player, Position } from '@common/player';
import { Room } from '@common/room';

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
    @Input() hasStarted: boolean;
    @Output() gridChange = new EventEmitter<number[][]>();
    @Output() itemsChange = new EventEmitter<number[][]>();
    @Output() heightChange = new EventEmitter<number>();

    oldMapName: string;

    tilesGrid: number[][];
    objectsArray: number[][];
    gridSize: number;
    currentPlayer: Player;

    selectedRow: number = 0;
    selectedCol: number = 0;

    isMouseDown: boolean = false;

    previousRow: number | null = null;
    previousCol: number | null = null;

    reachableTiles: Position[] = [];
    fastestPath: Position[] = [];
    isMoving: boolean = false;
    isActivePlayer: boolean = false;

    private toolService = inject(ToolService);
    private socketCommunicationService = inject(SocketCommunicationService);
    private navigationService = inject(NavigationService);

    constructor(
        private mapValidatorService: MapValidatorService,
        public tileService: TileService,
        public gameObjectService: GameObjectService,
        private gameCreationService: GameCreationService,
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

        this.socketCommunicationService.on<Room>('mapInformation', (room: Room) => {
            this.navigationService.initialize(room.gameMap, room.listPlayers, this.objectsArray);
            //  this.objectsArray = this.navigationService.objects;
            this.displayPortraitOnSpawnPoints();
            this.findReachableTiles();
            //  To do : assignier le currentPlayer...
        });

        this.socketCommunicationService.on('isActive', (playerId: string) => {
            this.isActivePlayer = playerId === this.socketCommunicationService.socket.id;
            const activePlayer = this.navigationService.players.find((player) => player.id === playerId);
            if (activePlayer && this.isActivePlayer) {
                this.currentPlayer = activePlayer;
            }
        });
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

    displayPortraitOnSpawnPoints() {
        for (const player of this.navigationService.players) {
            const { x, y } = player.position;
            if (this.navigationService.isPositionWithinBounds(x, y, this.objectsArray)) {
                this.objectsArray[x][y] = this.navigationService.getPortraitId(player.avatar?.name);
            }
        }
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
        if (this.gameCreationService.isModifiable) {
            this.gameObjectService.onDragStart(row, col);
            this.isMouseDown = false;
            this.toolService.deactivateTileApplicator();
        }
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
        if (this.gameCreationService.isModifiable) {
            this.tilesGrid = this.tileService.removeTile(event, row, col, this.tilesGrid, this.objectsArray);
            this.gameObjectService.removeObjectByClick(event, row, col);
            this.sendInfoToMapCreationPage();
        }
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
        return this.navigationService.isReachableTile(row, col);
    }

    findReachableTiles() {
        this.reachableTiles = [];
        this.reachableTiles = this.navigationService.findReachableTiles(
            this.navigationService.players[0],
            this.navigationService.gameMap,
            this.navigationService.players[0].attributes.movementPointsLeft,
        );
    }

    findPath(row: number, col: number) {
        if (this.isReachableTile(row, col)) {
            this.fastestPath = this.navigationService.findFastestPath(this.currentPlayer, { x: row, y: col }, this.navigationService.gameMap);
        }
    }

    isOnFastestPath(row: number, col: number): boolean {
        return this.fastestPath.some((tile) => tile.x === row && tile.y === col);
    }

    //  TODO : Qualite a revoir, il faut d<abord impelmenter la gestion des tours...
    async navigateToTile(row: number, col: number) {
        if (!this.gameCreationService.isModifiable && this.isActivePlayer && this.hasStarted) {
            if (!this.isMoving) {
                const path = this.navigationService.navigateToTile(this.currentPlayer, { x: row, y: col }, this.navigationService.gameMap);
                let currentPosition = this.currentPlayer.position;
                for (const tile of path) {
                    this.isMoving = true;
                    this.currentPlayer.position = { x: tile.x, y: tile.y };
                    if (this.navigationService.isInInitialPosition(currentPosition)) {
                        this.objectsArray[currentPosition.x][currentPosition.y] = ObjectType.Spawn;
                    } else if (this.navigationService.isObject(currentPosition)) {
                        this.objectsArray[currentPosition.x][currentPosition.y] = this.navigationService.getObject(currentPosition);
                    } else {
                        this.objectsArray[currentPosition.x][currentPosition.y] = 0;
                    }

                    this.displayPortraitOnSpawnPoints();
                    this.findReachableTiles();
                    currentPosition = this.currentPlayer.position;
                    if (this.navigationService.gameMap.tiles[currentPosition.x][currentPosition.y] === TileType.Ice) {
                        if (!this.navigationService.checkFell()) {
                            this.socketCommunicationService.send('playerFell', this.currentPlayer);
                            //  Todo affichage de message de TOMBER
                            break;
                        }
                    }
                    await this.delay(NAVIGATION_DELAY);
                }
                this.isMoving = false;
            }
        }
    }

    async delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
