/* eslint max-lines: ["off"] */
import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild,
} from '@angular/core';
import { TilePlayerInfoComponent } from '@app/components/tile-player-info/tile-player-info.component';
import { MapPosition } from '@app/interfaces/map-position';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { GameTileInfoService } from '@app/services/game-tile-info/game-tile-info.service';
import { MapValidatorService } from '@app/services/map-validator/map-validator.service';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { TileService } from '@app/services/tile/tile.service';
import { ToolService } from '@app/services/tool/tool.service';
import { Player, Position } from '@common/interfaces/player';
import { Room } from '@common/interfaces/room';
import { ClientToServerEvent, ServerToClientEvent } from '@common/socket.events';
@Component({
    selector: 'app-game-grid',
    standalone: true,
    imports: [TilePlayerInfoComponent],
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

    // Used in html
    isActivePlayer: boolean = false;
    tileInfoVisible: boolean = false;
    fastestPath: Position[] = [];
    currentPlayer: Player;
    objectsArray: number[][];
    tilesGrid: number[][];
    gridSize: number;

    previousRow: number | null = null;
    previousCol: number | null = null;

    private oldMapName: string;
    private activePlayer: Player | undefined;
    private isMouseDown: boolean = false;
    private isMoving: boolean = false;

    // Used in html
    public navigationService = inject(NavigationService);

    private toolService = inject(ToolService);
    private socketCommunicationService = inject(SocketCommunicationService);
    private gameService = inject(GameService);

    constructor(
        private mapValidatorService: MapValidatorService,
        private tileService: TileService,
        private gameObjectService: GameObjectService,
        private gameCreationService: GameCreationService,
        private gameTileInfoService: GameTileInfoService,
    ) {}

    @HostListener('document:click', ['$event'])
    onMapClick(event: MouseEvent) {
        if (!this.entireMap.nativeElement.contains(event.target)) {
            this.tileInfoVisible = false;
        }
    }

    getSelectedTile(): string {
        return this.toolService.getSelectedTile();
    }

    ngOnInit() {
        this.socketCommunicationService.connect();
        this.socketCommunicationService.on(ServerToClientEvent.ReachableTiles, (reachability: Position[]) => {
            this.navigationService.reachableTiles = reachability;
        });

        this.gridSize = this.gameCreationService.updateDimensions() as number;
        this.handleMapLoading();

        this.socketCommunicationService.on<Room>(ServerToClientEvent.MapInformation, (room: Room) => {
            this.navigationService.initialize(room, this.objectsArray);
            this.displayPortraitOnSpawnPoints(room.listPlayers);
        });

        this.initGameListeners();
        this.initMovementListeners();
        this.initObjectsListeners();

        this.socketCommunicationService.on(ServerToClientEvent.ObtainRoomInfo, (room: Room) => {
            this.gameTileInfoService.transferRoomData(room);
        });
    }

    initGameListeners() {
        this.socketCommunicationService.on<Player>(ServerToClientEvent.ActivePlayer, (activePlayer: Player) => {
            this.handleActivePlayer(activePlayer);
        });

        this.socketCommunicationService.on(ServerToClientEvent.CombatEnd, () => {
            if (this.activePlayer) {
                this.activePlayer.attributes.actionPoints -= 1;
            }
        });

        this.socketCommunicationService.on(ServerToClientEvent.PlayerDisconnected, (disconnectedPlayer: Player) => {
            this.navigationService.removePlayer(disconnectedPlayer);
        });

        this.socketCommunicationService.on(ServerToClientEvent.RespawnPlayer, (data: { oldPosition: Position; playerToReplace: Player }) => {
            this.handleRespawnPlayer(data.oldPosition, data.playerToReplace);
        });

        this.socketCommunicationService.on<number[][]>(ServerToClientEvent.DoorClicked, (tiles: number[][]) => {
            this.tilesGrid = tiles;
            this.gameService.isActionDoorSelected = false;
        });
    }

    initMovementListeners() {
        this.socketCommunicationService.on<Position>(ServerToClientEvent.PlayerNavigation, (tile) => {
            this.navigateToTile(tile);
        });

        this.socketCommunicationService.on(ServerToClientEvent.TeleportPlayer, (data: { position: Position; player: Player }) => {
            this.handleTeleport(data.position, data.player);
        });

        this.socketCommunicationService.on(ServerToClientEvent.EndMovement, () => {
            this.isMoving = false;
        });

        this.socketCommunicationService.on(ServerToClientEvent.PathFound, (path: Position[]) => {
            this.fastestPath = path;
        });
    }

    initObjectsListeners() {
        this.socketCommunicationService.on<Player>(ServerToClientEvent.UpdatedInventory, (playerToUpdate: Player) => {
            const result = this.navigationService.handleInventoryEvent(playerToUpdate, this.activePlayer);
            if (!result) return;
            this.activePlayer = result;
        });

        this.socketCommunicationService.on<number[][]>(ServerToClientEvent.UpdateObjects, (items) => {
            this.navigationService.updateObjects(items);
        });

        this.socketCommunicationService.on(ServerToClientEvent.UpdateObjectsAfterCombat, (data: { newGrid: number[][]; position: Position }) => {
            this.navigationService.updateObjects(data.newGrid);
            this.objectsArray[data.position.x][data.position.y] = data.newGrid[data.position.x][data.position.y];
        });
    }

    handleTeleport(position: Position, player: Player) {
        if (player) {
            this.navigateToTile(position);
        }
    }

    handleRespawnPlayer(oldPosition: Position, respawningPlayer: Player) {
        if (this.activePlayer?.id === respawningPlayer.id) {
            this.navigateToTile(respawningPlayer.position);
        } else {
            this.respawnPlayer(oldPosition, respawningPlayer);
        }
    }

    handleMapLoading() {
        if (this.gameCreationService.isNewGame) {
            this.loadNewGame();
        } else {
            this.loadExistingGame();
        }
    }

    handleActivePlayer(activePlayer: Player) {
        this.isActivePlayer = activePlayer.id === this.socketCommunicationService.socket.id;
        this.activePlayer = activePlayer;
        if (this.activePlayer && this.isActivePlayer) {
            this.currentPlayer = this.activePlayer;
        }
    }

    getTileImage(col: number) {
        return this.tileService.getTileImage(col);
    }

    loadNewGame() {
        this.objectsArray = this.gameObjectService.initObjectsArray();
        this.tilesGrid = this.gameCreationService.resetGrid(this.gridSize, this.tilesGrid);
    }

    loadExistingGame() {
        this.gameObjectService.loadExistingGame();
        this.tilesGrid = this.gameCreationService.loadExistingTiles();
        this.objectsArray = this.gameCreationService.loadExistingObjects();
        this.oldMapName = this.gameCreationService.loadedMapName;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!changes.resetTrigger?.previousValue && changes.resetTrigger?.currentValue) {
            this.onResetTrigger();
        }
        if (changes.saveTrigger && this.saveTrigger) {
            this.mapValidatorService.validateMap({
                tiles: this.tilesGrid,
                objects: this.objectsArray,
                title: this.mapName,
                description: this.mapDescription,
                oldMapName: this.oldMapName,
                isNewMap: this.gameCreationService.isNewGame,
            });
        }
        this.sendInfoToMapCreationPage();
    }

    displayPortraitOnSpawnPoints(players: Player[]) {
        this.objectsArray = this.navigationService.displayPortraitsOnSpawnPoints(players, this.objectsArray);
    }

    onResetTrigger() {
        if (!this.gameCreationService.isNewGame) {
            this.resetNewMap();
        } else {
            this.resetExistingMap();
        }
    }

    resetNewMap() {
        this.loadExistingGame();
        this.gameObjectService.loadMapObjectCount();
    }

    resetExistingMap() {
        this.objectsArray = this.gameObjectService.initObjectsArray();
        this.gameObjectService.resetObjectsCount();
        this.tilesGrid = this.gameCreationService.resetGrid(this.gridSize, this.tilesGrid);
    }

    sendInfoToMapCreationPage() {
        this.gridChange.emit(this.tilesGrid);
        this.itemsChange.emit(this.objectsArray);
        this.heightChange.emit(this.gridSize);
    }

    onDragStart(row: number, col: number) {
        this.isMouseDown = this.gameObjectService.startMouseDrag({ x: row, y: col }, this.isMouseDown);
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent, row: number, col: number) {
        this.isMouseDown = this.gameObjectService.startDropItem(event, {
            position: { x: row, y: col },
            tiles: this.tilesGrid,
            objects: this.objectsArray,
        });
        this.objectsArray = this.gameObjectService.objectsArray;
        this.sendInfoToMapCreationPage();
    }

    getObjectImage(id: number): string {
        const gameObject = this.gameObjectService.getObjectById(id);
        return gameObject ? gameObject.image : '';
    }

    removeOnRightClick(event: MouseEvent, row: number, col: number) {
        this.tilesGrid = this.gameObjectService.removeOnRightClick(event, {
            position: { x: row, y: col },
            tiles: this.tilesGrid,
            objects: this.objectsArray,
        });
        this.sendInfoToMapCreationPage();
    }

    handleRightClick(event: MouseEvent, row: number, col: number) {
        event.preventDefault();
        const result = this.gameCreationService.rightClick({ x: row, y: col }, this.isMoving, this.isActivePlayer);
        this.isMoving = result[0];
        this.tileInfoVisible = result[1];
    }

    showDetails(row: number, col: number) {
        this.tileInfoVisible = this.gameCreationService.showDetails({ x: row, y: col });
    }

    closeTileDescription() {
        this.tileInfoVisible = false;
    }

    previousTileCheck(position: MapPosition) {
        return this.isMouseDown && this.previousRow === position.row && this.previousCol === position.col;
    }

    onTileClick(row: number, col: number) {
        if (this.previousTileCheck({ row, col })) return;
        this.tilesGrid = this.gameObjectService.handleTileClick({ row, col }, this.tilesGrid, this.getSelectedTile());
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
        this.tilesGrid = this.tileService.removeTile(event, { position: { x: row, y: col }, tiles: this.tilesGrid, objects: this.objectsArray });
    }

    findPath(row: number, col: number) {
        this.fastestPath = this.navigationService.findPath({ row, col }, this.activePlayer!, this.fastestPath);
        if (this.navigationService.isReachableTile({ row, col }) && this.isActivePlayer) {
            this.socketCommunicationService.send(ClientToServerEvent.FindPath, { x: row, y: col });
        }
    }

    isOnFastestPath(row: number, col: number): boolean {
        return this.fastestPath.some((tile) => tile.x === row && tile.y === col);
    }

    handleTileClick(row: number, col: number) {
        if (this.gameService.canOpenDoor(this.activePlayer!)) {
            this.socketCommunicationService.send(ClientToServerEvent.DoorAction, { clickedPosition: { x: row, y: col }, player: this.activePlayer });
            return;
        } else if (this.gameService.canStartCombat(this.activePlayer!)) {
            this.activePlayer = this.gameService.handleFightAction(
                { position: { x: row, y: col }, tiles: this.tilesGrid, objects: this.objectsArray },
                this.activePlayer!,
            ); // could remove handleFightAction and place it elsewhere
            return;
        } else if (this.navigationService.noInteractionPossible({ row, col }, this.tilesGrid, this.activePlayer!)) {
            this.sendNavigation();
        }
    }

    isActionSelected() {
        return this.gameService.isActionSelected();
    }

    async sendNavigation() {
        if (!this.gameCreationService.isModifiable && this.isActivePlayer && this.hasStarted) {
            if (!this.isMoving) {
                this.isMoving = true;
                const path = this.fastestPath;
                this.socketCommunicationService.send(ClientToServerEvent.PlayerNavigation, path);
                this.fastestPath = [];
            }
        }
    }

    respawnPlayer(position: Position, player: Player) {
        this.objectsArray = this.navigationService.respawnPlayer(position, player, this.objectsArray);
    }

    navigateToTile(position: Position) {
        const updatedObjectsAndPlayer = this.navigationService.navigateToTile(position, this.activePlayer!, this.objectsArray);
        this.fastestPath = [];
        this.objectsArray = updatedObjectsAndPlayer[0];
        this.activePlayer!.position = updatedObjectsAndPlayer[1].position;
    }

    isTarget(row: number, col: number) {
        return this.gameService.isTarget(row, col);
    }
}
