import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { GameObjectComponent } from '@app/components/map-editor/game-object/game-object.component';
import { NO_OBJECT, ObjectType } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { MapValidatorService, TileType } from '@app/services/map-validator/map-validator.service';
import { NavigationService } from '@app/services/navigation.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { TileService } from '@app/services/tile/tile.service';
import { ToolService } from '@app/services/tool/tool.service';
import { Game } from '@common/game';
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

    get selectedTile(): string {
        return this.toolService.getSelectedTile();
    }

    ngOnInit() {
        if (!this.socketCommunicationService.isSocketAlive()) {
            this.socketCommunicationService.connect();
        }

        this.gridSize = this.gameCreationService.updateDimensions() as number;

        if (this.gameCreationService.isNewGame) {
            this.objectsArray = this.gameObjectService.initObjectsArray();
            this.tilesGrid = this.tileService.resetGrid(this.gridSize, this.tilesGrid);
        } else {
            this.tilesGrid = this.deepCopyMatrix(this.gameCreationService.loadedTiles);
            this.objectsArray = this.deepCopyMatrix(this.gameCreationService.loadedObjects);
            this.gameObjectService.objectsArray = this.objectsArray;
            this.oldMapName = this.gameCreationService.loadedMapName;
        }
        this.socketCommunicationService.on<Room>('mapInformation', (room: Room) => {
            this.players = room.listPlayers;
            this.gameMap = room.gameMap;
            // this.displayPortraitOnSpawnPoints(room.listPlayers);
            this.displayPortraitOnSpawnPoints();
            this.findReachableTiles();
            //To do : assignier le currentPlayer...
        });
    }

    displayPortraitOnSpawnPoints() {
        for (const player of this.players) {
            const { x, y } = player.position;
            if (this.isPositionWithinBounds(x, y, this.objectsArray)) {
                this.objectsArray[x][y] = this.getPortraitId(player.avatar?.name);
            }
        }
    }

    getPortraitId(godName: string | undefined) {
        switch (godName) {
            case 'Hestia':
                return ObjectType.Hestia;
            case 'Zeus':
                return ObjectType.Zeus;
            case 'Hera':
                return ObjectType.Hera;
            case 'Poseidon':
                return ObjectType.Poseidon;
            case 'Artemis':
                return ObjectType.Artemis;
            case 'Demeter':
                return ObjectType.Demeter;
            case 'Hermes':
                return ObjectType.Hermes;
            case 'Athena':
                return ObjectType.Athena;
            case 'Hephaestus':
                return ObjectType.Hephaestus;
            case 'Apollo':
                return ObjectType.Apollo;
            case 'Ares':
                return ObjectType.Ares;
            case 'Aphrodite':
                return ObjectType.Aphrodite;
            default:
                return ObjectType.Spawn;
        }
    }

    deepCopyMatrix(matrix: number[][] | null): number[][] {
        if (!matrix) {
            return [];
        }
        return JSON.parse(JSON.stringify(matrix));
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.resetTrigger && changes.resetTrigger.previousValue === false && changes.resetTrigger.currentValue === true) {
            if (!this.gameCreationService.isNewGame) {
                this.tilesGrid = this.deepCopyMatrix(this.gameCreationService.loadedTiles);
                this.objectsArray = this.deepCopyMatrix(this.gameCreationService.loadedObjects);
                this.gameObjectService.objectsArray = this.objectsArray;
                this.gameObjectService.loadMapObjectCount();
            } else {
                this.objectsArray = this.gameObjectService.initObjectsArray();
                this.gameObjectService.resetObjectsCount();
                this.tilesGrid = this.tileService.resetGrid(this.gridSize, this.tilesGrid);
            }

            this.sendInfoToMapCreationPage();
        }
        if (changes.saveTrigger && this.saveTrigger) {
            this.mapValidatorService.validateMap(
                this.tilesGrid,
                this.mapName,
                this.mapDescription,
                this.gameCreationService.isNewGame,
                this.oldMapName,
            );
            this.sendInfoToMapCreationPage();
        }
    }

    sendInfoToMapCreationPage() {
        this.gridChange.emit(this.tilesGrid);
        this.itemsChange.emit(this.objectsArray);
        this.heightChange.emit(this.gridSize);
    }

    onDragStart(event: DragEvent, row: number, col: number) {
        if (this.gameCreationService.isModifiable) {
            this.toolService.deactivateTileApplicator();
            this.gameObjectService.selectedTile = null;
            this.isMouseDown = false;
            this.gameObjectService.dragStartPosition = { row, col };
            const gameObject = this.gameObjectService.getGameObjectOnTile(row, col);
            if (gameObject) {
                this.gameObjectService.draggedObject = gameObject;
            }
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDrop(event: DragEvent, row: number, col: number) {
        event.preventDefault();
        const gameObject = this.gameObjectService.draggedObject;
        if (gameObject && this.objectsArray[row][col] === NO_OBJECT && this.isValidTileForObject(row, col)) {
            this.gameObjectService.updateObjectGridPosition(gameObject, row, col);
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
        if (this.gameCreationService.isModifiable) {
            event.preventDefault();
            this.removeTile(event, row, col);
            this.gameObjectService.removeObjectByClick(event, row, col);
            this.sendInfoToMapCreationPage();
        }
    }

    onTileClick(row: number, col: number) {
        if (this.isMouseDown && this.previousRow === row && this.previousCol === col) {
            return;
        }

        this.updateSelectedTile(row, col);
        this.handleGameObjectOnTile(row, col);
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
        const path = this.navigationService.navigateToTile(this.players[0], { x: row, y: col }, this.gameMap);
        if (!this.isMoving) {
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
        }
        this.isMoving = false;
    }
    checkFell(): boolean {
        const randomValue = Math.random();
        return randomValue > 0.1;
    }

    delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
