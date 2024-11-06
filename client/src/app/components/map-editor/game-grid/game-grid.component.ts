import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { GameObjectComponent } from '@app/components/map-editor/game-object/game-object.component';
import { TilePlayerInfoComponent } from '@app/components/tile-player-info/tile-player-info.component';
import { NO_OBJECT, TileType } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { GameTileInfoService } from '@app/services/game-tile-info/game-tile-info.service';
import { MapValidatorService } from '@app/services/map-validator/map-validator.service';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { TileService } from '@app/services/tile/tile.service';
import { ToolService } from '@app/services/tool/tool.service';
import { Player, Position } from '@common/player';
import { Room } from '@common/room';

@Component({
    selector: 'app-game-grid',
    standalone: true,
    imports: [GameObjectComponent, TilePlayerInfoComponent],
    templateUrl: './game-grid.component.html',
    styleUrl: './game-grid.component.scss',
})
export class GameGridComponent implements OnInit, OnChanges, OnDestroy {
    @ViewChild('entireMap') entireMap!: ElementRef;
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
    activePlayer: Player | undefined;

    selectedRow: number = 0;
    selectedCol: number = 0;

    isMouseDown: boolean = false;

    previousRow: number | null = null;
    previousCol: number | null = null;

    reachableTiles: Position[] = [];
    fastestPath: Position[] = [];
    isMoving: boolean = false;
    isActivePlayer: boolean = false;

    isPopupVisible: boolean = false;
    popupX: number = 0;
    popupY: number = 0;

    private toolService = inject(ToolService);
    private socketCommunicationService = inject(SocketCommunicationService);
    private navigationService = inject(NavigationService);

    constructor(
        private mapValidatorService: MapValidatorService,
        public tileService: TileService,
        public gameObjectService: GameObjectService,
        public gameCreationService: GameCreationService,
        public gameTileInfoService: GameTileInfoService,
    ) {}

    getSelectedTile(): string {
        return this.toolService.getSelectedTile();
    }

    ngOnInit() {
        document.addEventListener('click', this.onMapClick.bind(this)); ////

        this.socketCommunicationService.connect();

        this.gridSize = this.gameCreationService.updateDimensions() as number;
        if (this.gameCreationService.isNewGame) {
            this.loadNewGame();
        } else {
            this.loadExistingGame();
        }

        this.socketCommunicationService.on<Room>('mapInformation', (room: Room) => {
            this.navigationService.initialize(room.gameMap, room.listPlayers, this.objectsArray);
            this.displayPortraitOnSpawnPoints();
        });

        this.socketCommunicationService.on('isActive', (playerId: string) => {
            this.isActivePlayer = playerId === this.socketCommunicationService.socket.id;
            this.activePlayer = this.navigationService.players.find((player) => player.id === playerId);
            if (this.activePlayer && this.isActivePlayer) {
                this.currentPlayer = this.activePlayer;
            }

            if (this.activePlayer) {
                this.activePlayer.attributes.movementPointsLeft = this.activePlayer.attributes.speed;
            }
            this.findReachableTiles();
        });

        this.socketCommunicationService.on<Position>('playerNavigation', (tile) => {
            this.navigateToTile(tile);
        });

        this.socketCommunicationService.on('endMovement', () => {
            this.isMoving = false;
            this.checkEndTurn();
        });

        this.socketCommunicationService.on('playerDisconnected', (disconnectedPlayer: Player) => {
            this.navigationService.removePlayer(disconnectedPlayer);
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

    showDetails(event: MouseEvent, row: number, col: number) {
        event.preventDefault();
        if (!this.gameCreationService.isModifiable && this.isActivePlayer) {
            this.isPopupVisible = true;
            this.gameTileInfoService.tileId = this.tilesGrid[row][col];
            this.gameTileInfoService.itemId = this.objectsArray[row][col];
            this.gameTileInfoService.selectedRow = row;
            this.gameTileInfoService.selectedCol = col;
        }
    }

    closeTileDescription() {
        this.isPopupVisible = false;
    }

    onMapClick(event: MouseEvent) {
        if (!this.entireMap.nativeElement.contains(event.target)) {
            this.isPopupVisible = false;
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
        if (!this.activePlayer) return;
        this.reachableTiles = this.navigationService.findReachableTiles(
            this.activePlayer,
            this.navigationService.gameMap,
            this.activePlayer.attributes.movementPointsLeft,
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

    async sendNavigation(row: number, col: number) {
        if (!this.gameCreationService.isModifiable && this.isActivePlayer && this.hasStarted) {
            if (!this.isMoving) {
                this.isMoving = true;
                const path = this.navigationService.navigateToTile(this.currentPlayer, { x: row, y: col }, this.navigationService.gameMap);
                this.socketCommunicationService.send('playerNavigation', path);
            }
        }
    }

    navigateToTile(position: Position) {
        this.findReachableTiles();
        if (this.activePlayer) {
            this.navigationService.updateTile(this.activePlayer);
            const cost = this.navigationService.getTileCost(this.tilesGrid[position.x][position.y]);
            this.activePlayer.attributes.movementPointsLeft -= cost;
            this.activePlayer.position = position;
        }
        this.displayPortraitOnSpawnPoints();
    }

    checkEndTurn() {
        if (!this.activePlayer) return;
        if (this.activePlayer.id !== this.currentPlayer.id) return;
        const reachableTileCount = this.navigationService.findReachableTiles(
            this.activePlayer,
            this.navigationService.gameMap,
            this.activePlayer.attributes.movementPointsLeft,
        ).length;

        // Player has movement point left, no action left.
        // Player is blocked by closed door or players.
        if (!this.navigationService.haveActions(this.activePlayer) && reachableTileCount === 0) {
            this.socketCommunicationService.send('endTurn');
        }

        // Player has no movement point left. Player has action point left but
        // no valid target on adjacent tiles.
        else if (this.activePlayer.attributes.movementPointsLeft === 0 && !this.navigationService.haveActions(this.activePlayer)) {
            this.socketCommunicationService.send('endTurn');
        }

        // Player has no movement point or action left.
        else if (this.activePlayer.attributes.movementPointsLeft === 0 && this.activePlayer.attributes.actionPoints === 0) {
            this.socketCommunicationService.send('endTurn');
        }
    }
}
