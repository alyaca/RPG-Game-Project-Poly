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
import { NO_OBJECT } from '@app/constants';
import { ValidatingMapInfo } from '@app/interfaces/validating-map-info';
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
import { TileType } from '@common/constants';
import { Player, Position } from '@common/interfaces/player';
import { Room } from '@common/interfaces/room';
import { TileRemoval } from '@common/interfaces/tile-removal';
import { gameObjects } from '@common/objects-info';
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
    isPopupVisible: boolean = false;
    fastestPath: Position[] = [];
    currentPlayer: Player;
    objectsArray: number[][];
    tilesGrid: number[][];
    gridSize: number;

    private oldMapName: string;

    private activePlayer: Player | undefined;

    private isMouseDown: boolean = false;

    private previousRow: number | null = null;
    private previousCol: number | null = null;

    private isMoving: boolean = false;

    private toolService = inject(ToolService);
    private socketCommunicationService = inject(SocketCommunicationService);
    private navigationService = inject(NavigationService);
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
            this.isPopupVisible = false;
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
        if (this.gameCreationService.isNewGame) {
            this.loadNewGame();
        } else {
            this.loadExistingGame();
        }

        this.socketCommunicationService.on<Room>(ServerToClientEvent.MapInformation, (room: Room) => {
            this.navigationService.initialize(room.gameMap, room.listPlayers, this.objectsArray);
            this.displayPortraitOnSpawnPoints(room.listPlayers);
        });

        this.socketCommunicationService.on(ServerToClientEvent.DoorClicked, (tiles: number[][]) => {
            this.tilesGrid = tiles;
            this.gameService.isActionDoorSelected = false;
        });

        this.socketCommunicationService.on(ServerToClientEvent.ActivePlayer, (activePlayer: Player) => {
            this.isActivePlayer = activePlayer.id === this.socketCommunicationService.socket.id;
            this.activePlayer = activePlayer;
            if (this.activePlayer && this.isActivePlayer) {
                this.currentPlayer = this.activePlayer;
            }
        });

        this.socketCommunicationService.on<Position>(ServerToClientEvent.PlayerNavigation, (tile) => {
            this.navigateToTile(tile);
        });

        this.socketCommunicationService.on(ServerToClientEvent.RespawnPlayer, (data: { oldPosition: Position; playerToReplace: Player }) => {
            const { oldPosition, playerToReplace } = data;
            if (this.activePlayer?.id === playerToReplace.id) {
                this.navigateToTile(playerToReplace.position);
            } else {
                this.respawnPlayer(oldPosition, playerToReplace);
            }
        });

        this.socketCommunicationService.on(ServerToClientEvent.TeleportPlayer, (data: { position: Position; playerId: string }) => {
            const { position, playerId } = data;
            const playerToTeleport = this.navigationService.players.find((p) => p.id === playerId);
            if (playerToTeleport) {
                this.navigateToTile(position);
            }
        });

        this.socketCommunicationService.on(ServerToClientEvent.EndMovement, () => {
            this.isMoving = false;
        });

        this.socketCommunicationService.on(ServerToClientEvent.PlayerDisconnected, (disconnectedPlayer: Player) => {
            this.navigationService.removePlayer(disconnectedPlayer);
        });

        this.socketCommunicationService.on(ServerToClientEvent.PathFound, (path: Position[]) => {
            this.fastestPath = path;
        });

        this.socketCommunicationService.on(ServerToClientEvent.CombatEnd, () => {
            if (this.activePlayer) {
                this.activePlayer.attributes.actionPoints -= 1;
            }
        });

        this.socketCommunicationService.on<Player>(ServerToClientEvent.UpdatedInventory, (playerToUpdate: Player) => {
            const index = this.navigationService.players.findIndex((players) => players.name === playerToUpdate.name);
            if (this.activePlayer) {
                this.activePlayer.inventory = playerToUpdate.inventory;
                this.activePlayer.attributes = playerToUpdate.attributes;
                this.activePlayer.attributes.currentHp = playerToUpdate.attributes.totalHp;
            }
            this.navigationService.players[index].attributes = playerToUpdate.attributes;
            this.navigationService.players[index].inventory = playerToUpdate.inventory;
        });

        this.socketCommunicationService.on<number[][]>(ServerToClientEvent.UpdateObjects, (items) => {
            this.navigationService.updateObjects(items);
        });

        this.socketCommunicationService.on(ServerToClientEvent.UpdateObjectsAfterCombat, (data: { newGrid: number[][]; position: Position }) => {
            this.navigationService.updateObjects(data.newGrid);
            this.objectsArray[data.position.x][data.position.y] = data.newGrid[data.position.x][data.position.y];
        });

        this.socketCommunicationService.on(ServerToClientEvent.ObtainRoomInfo, (room: Room) => {
            this.gameTileInfoService.transferRoomData(room);
        });
    }

    getTileImage(col: number) {
        return this.tileService.getTileImage(col);
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
        return matrix ? JSON.parse(JSON.stringify(matrix)) : [];
    }

    ngOnChanges(changes: SimpleChanges) {
        if (!changes.resetTrigger?.previousValue && changes.resetTrigger?.currentValue) {
            this.onResetTrigger();
        }
        if (changes.saveTrigger && this.saveTrigger) {
            const validationInfo: ValidatingMapInfo = {
                tiles: this.tilesGrid,
                objects: this.objectsArray,
                title: this.mapName,
                description: this.mapDescription,
                oldMapName: this.oldMapName,
                isNewMap: this.gameCreationService.isNewGame,
            };
            this.mapValidatorService.validateMap(validationInfo);
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
        this.gameObjectService.onDrop(event, { position: { x: row, y: col }, tiles: this.tilesGrid, objects: this.objectsArray });
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
            const tileRemovalInfo: TileRemoval = { position: { x: row, y: col }, tiles: this.tilesGrid, objects: this.objectsArray };
            this.tilesGrid = this.tileService.removeTile(event, tileRemovalInfo);
            this.gameObjectService.removeObjectByClick(event, row, col);
            this.sendInfoToMapCreationPage();
        }
    }

    checkTeleportation(position: Position) {
        if (!this.gameCreationService.isModifiable && this.isActivePlayer) {
            if (!this.isMoving) {
                this.isMoving = true;
                this.socketCommunicationService.send(ClientToServerEvent.TeleportPlayer, position);
            }
        }
    }

    handleRightClick(event: MouseEvent, row: number, col: number) {
        event.preventDefault();
        if (this.navigationService.isDebugMode) {
            const position: Position = { x: row, y: col };
            this.checkTeleportation(position);
        } else {
            this.showDetails(row, col);
        }
    }

    showDetails(row: number, col: number) {
        if (!this.gameCreationService.isModifiable) {
            this.socketCommunicationService.send(ClientToServerEvent.GetRoom);
            this.isPopupVisible = true;

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
        return this.navigationService.isReachableTile(row, col);
    }

    findPath(row: number, col: number) {
        if (this.checkIfPlayerIsOnTile(row, col)) {
            this.fastestPath = [];
            return;
        }
        if (this.isReachableTile(row, col) && this.isActivePlayer) {
            this.socketCommunicationService.send(ClientToServerEvent.FindPath, { x: row, y: col });
        }
    }

    isOnFastestPath(row: number, col: number): boolean {
        return this.fastestPath.some((tile) => tile.x === row && tile.y === col);
    }

    handleTileClick(row: number, col: number) {
        if (this.gameService.isActionDoorSelected && this.activePlayer && this.gameService.hasActionPoints(this.activePlayer)) {
            const position: Position = { x: row, y: col };
            this.socketCommunicationService.send(ClientToServerEvent.DoorAction, { clickedPosition: position, player: this.activePlayer });
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
            this.socketCommunicationService.send(ClientToServerEvent.StartFight, {
                player1: attacker,
                player2: defender,
                isPlayer1Active: isActivePlayerAttacker,
            });
        }
    }

    isActionSelected() {
        return this.gameService.isActionSelected();
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
                this.socketCommunicationService.send(ClientToServerEvent.PlayerNavigation, path);
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
        this.navigationService.reachableTiles = [];
        this.fastestPath = [];
        if (this.activePlayer) {
            this.navigationService.updateTile(this.activePlayer);
            this.activePlayer.position = position;
            this.placeAvatarOnTile(this.activePlayer);
        }
    }

    isTarget(row: number, col: number) {
        return this.gameService.isTarget(row, col);
    }
}
