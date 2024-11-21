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

import { NO_OBJECT, TileType } from '@app/constants';
import { gameObjects } from '@app/objects-info';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { GameTileInfoService } from '@app/services/game-tile-info/game-tile-info.service';
import { MapValidatorService } from '@app/services/map-validator/map-validator.service';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { TileService } from '@app/services/tile/tile.service';
import { ToolService } from '@app/services/tool/tool.service';
import { ObjectType } from '@common/avatars-info';
import { Player, Position } from '@common/player';
import { Room } from '@common/room';
import { TilePlayerInfoComponent } from '@app/components/tile-player-info/tile-player-info.component';

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

    private toolService = inject(ToolService);
    private socketCommunicationService = inject(SocketCommunicationService);
    private navigationService = inject(NavigationService);
    private gameService = inject(GameService);

    constructor(
        private mapValidatorService: MapValidatorService,
        public tileService: TileService,
        public gameObjectService: GameObjectService,
        public gameCreationService: GameCreationService,
        public gameTileInfoService: GameTileInfoService,
    ) {}

    @HostListener('document:click', ['$event'])
    onMapClick(event: MouseEvent) {
        if (!this.entireMap.nativeElement.contains(event.target)) {
            this.isPopupVisible = false;
        }
    }

    getSelectedTile(): string {
        return this.toolService.getSelectedTile();
    }

    ngOnInit() {
        this.socketCommunicationService.connect();
        this.socketCommunicationService.on('reachableTiles', (reachability: Position[]) => {
            this.reachableTiles = reachability;
        });

        this.gridSize = this.gameCreationService.updateDimensions() as number;
        if (this.gameCreationService.isNewGame) {
            this.loadNewGame();
        } else {
            this.loadExistingGame();
        }

        this.socketCommunicationService.on<Room>('mapInformation', (room: Room) => {
            this.navigationService.initialize(room.gameMap, room.listPlayers, this.objectsArray);
            this.displayPortraitOnSpawnPoints(room.listPlayers);
        });

        this.socketCommunicationService.on('doorClicked', (tiles: number[][]) => {
            this.tilesGrid = tiles;
            this.gameService.isActionDoorSelected = false;
        });

        this.socketCommunicationService.on('isActive', (activePlayer: Player) => {
            this.isActivePlayer = activePlayer.id === this.socketCommunicationService.socket.id;
            this.activePlayer = activePlayer;
            if (this.activePlayer && this.isActivePlayer) {
                this.currentPlayer = this.activePlayer;
            }
        });

        this.socketCommunicationService.on<Position>('playerNavigation', (tile) => {
            this.navigateToTile(tile);
        });

        this.socketCommunicationService.on('respawnPlayer', (data: { oldPosition: Position; playerToReplace: Player }) => {
            const { oldPosition, playerToReplace } = data;
            if (this.activePlayer?.id === playerToReplace.id) {
                this.navigateToTile(playerToReplace.position);
            } else {
                this.respawnPlayer(oldPosition, playerToReplace);
            }
        });

        this.socketCommunicationService.on('endMovement', () => {
            this.isMoving = false;
        });

        this.socketCommunicationService.on('playerDisconnected', (disconnectedPlayer: Player) => {
            this.navigationService.removePlayer(disconnectedPlayer);
        });

        this.socketCommunicationService.on('pathFound', (path: Position[]) => {
            this.fastestPath = path;
        });

        this.socketCommunicationService.on('combatEnd', () => {
            if (this.activePlayer) {
                this.activePlayer.attributes.actionPoints = 0;
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

    displayPortraitOnSpawnPoints(players: Player[]) {
        for (const player of players) {
            const { x, y } = player.position;
            if (this.navigationService.isPositionWithinBounds(x, y, this.objectsArray)) {
                this.objectsArray[x][y] = this.navigationService.getPortraitId(player.avatar?.name);
            }
        }
    }

    placeAvatarOnTile(player: Player) {
        this.objectsArray[player.position.x][player.position.y] = this.navigationService.getPortraitId(player.avatar?.name);
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

    findPath(row: number, col: number) {
        if (this.checkIfPlayerIsOnTile(row, col)) {
            this.fastestPath = [];
            return;
        }
        if (this.isReachableTile(row, col) && this.isActivePlayer) {
            this.socketCommunicationService.send('findPath', { x: row, y: col });
        }
    }

    isOnFastestPath(row: number, col: number): boolean {
        return this.fastestPath.some((tile) => tile.x === row && tile.y === col);
    }

    handleTileClick(row: number, col: number) {
        if (this.gameService.isActionDoorSelected && this.activePlayer && this.gameService.hasActionPoints(this.activePlayer)) {
            const clickedTile: Position = { x: row, y: col };
            this.socketCommunicationService.send('doorAction', { position: clickedTile, player: this.activePlayer });
            return;
        } else if (this.gameService.isActionCombatSelected && this.activePlayer && this.gameService.hasActionPoints(this.activePlayer)) {
            this.handleFightAction(row, col);
            return;
        } else if (this.isReachableTile(row, col) && this.tilesGrid[row][col] !== TileType.ClosedDoor && !this.checkIfPlayerIsOnTile(row, col)) {
            this.sendNavigation();
        }
    }

    checkIfPlayerIsOnTile(row: number, col: number): boolean {
        return this.activePlayer?.position.x === row && this.activePlayer?.position.y === col;
    }

    handleFightAction(row: number, col: number) {
        if (this.activePlayer && this.navigationService.isNeighbor(row, col, this.activePlayer) && this.objectsArray[row][col] > ObjectType.Spawn) {
            this.activePlayer.attributes.actionPoints--;
            this.gameService.isActionCombatSelected = false;
            const player1 = this.activePlayer;
            const player2 = this.getPlayerByAvatarName(this.navigationService.players, this.objectsArray[row][col]);
            const [attacker, defender] = player2 && player1.attributes.speed < player2.attributes.speed ? [player2, player1] : [player1, player2];
            const isActivePlayerAttacker = player1.id === attacker.id;
            this.socketCommunicationService.send('startFight', { player1: attacker, player2: defender, isPlayer1Active: isActivePlayerAttacker });
        }
    }

    getPlayerByAvatarName(players: Player[], id: ObjectType) {
        const avatarName = gameObjects.find((obj) => obj.id === id)?.name;
        const clickedPlayer = players.find((player) => player.avatar?.name === avatarName);
        return clickedPlayer;
    }

    async sendNavigation() {
        if (!this.gameCreationService.isModifiable && this.isActivePlayer && this.hasStarted) {
            if (!this.isMoving) {
                this.isMoving = true;
                const path = this.fastestPath;
                this.socketCommunicationService.send('playerNavigation', path);
                this.fastestPath = [];
            }
        }
    }

    respawnPlayer(position: Position, player: Player) {
        let playerToReplace = this.navigationService.players.find((p) => p.id === player.id);
        if (!playerToReplace) return;
        playerToReplace.position = position;
        this.navigationService.updateTile(playerToReplace);
        playerToReplace = player;
        this.placeAvatarOnTile(playerToReplace);
    }

    navigateToTile(position: Position) {
        this.reachableTiles = [];
        this.fastestPath = [];
        if (this.activePlayer) {
            this.navigationService.updateTile(this.activePlayer);
            this.activePlayer.position = position;
            this.placeAvatarOnTile(this.activePlayer);
        }
    }
}
