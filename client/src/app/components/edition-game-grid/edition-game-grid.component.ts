import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { GameObjectComponent } from '@app/components/game-object/game-object.component';
import { NO_OBJECT, SIZE_SMALL_MAP } from '@app/constants';
import { GameObjectManagerService } from '@app/services/game-object-manager/game-object-manager.service';
import { ToolService } from '@app/services/tool.service';

enum TileType {
    Ground = 1,
    Ice = 2,
    Wall = 3,
    Water = 4,
    ClosedDoor = 5,
    OpenDoor = 6,
}

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
    gridArray: number[][];
    height: number = SIZE_SMALL_MAP;
    width: number = SIZE_SMALL_MAP;

    selectedRow: number = 0;
    selectedCol: number = 0;

    isMouseDown: boolean = false;
    objectsArray: number[][];

    constructor(
        private toolService: ToolService,
        private gameObjectManagerService: GameObjectManagerService,
    ) {
        this.objectsArray = this.gameObjectManagerService.objectsArray;
    }

    get selectedTile() {
        return this.toolService.getSelectedTile();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['selectedSize']) {
            // this.updateDimensions();
            this.gridArray = this.createNewMap();
        }
        if (changes['resetTrigger'] && this.resetTrigger) {
            this.resetGrid();
        }
    }

    onDragStart(event: DragEvent, row: number, col: number) {
        console.log('dragstart form grid');
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
        if (gameObject && this.isValidTileForObject(row, col)) {
            this.gameObjectManagerService.updateObjectGridPosition(gameObject, row, col);
        }
    }

    isValidTileForObject(row: number, col: number): boolean {
        const invalidTileTypes = [TileType.Wall, TileType.OpenDoor, TileType.ClosedDoor];
        return this.objectsArray[row][col] === NO_OBJECT && !invalidTileTypes.includes(this.gridArray[row][col]);
    }

    //Sprint 1: Only the spawn point
    getObjectImage(id: number): string {
        // if (ObjectType.Spawn === id) {
        const gameObject = this.gameObjectManagerService.getObjectById(id);
        if (gameObject) {
            return gameObject.image;
        }
        // }
        return '';
    }

    getTileImage(value: number): string {
        switch (value) {
            case TileType.Ground:
                return '/assets/images/tiles/grass.jpg';
            case TileType.Ice:
                return '/assets/images/tiles/ice.jpg';
            case TileType.Wall:
                return '/assets/images/tiles/wall.jpg';
            case TileType.Water:
                return '/assets/images/tiles/water.jpg';
            case TileType.ClosedDoor:
                return '/assets/images/tiles/closed-door.jpg';
            case TileType.OpenDoor:
                return '/assets/images/tiles/open-door.jpg';
            default:
                return '';
        }
    }

    createNewMap(): number[][] {
        return Array.from({ length: this.height }, () => Array(this.width).fill(1));
    }

    onTileClick(row: number, col: number) {
        this.selectedRow = row;
        this.selectedCol = col;

        switch (this.selectedTile) {
            case 'ice-tile':
                this.gridArray[row][col] = TileType.Ice;
                break;
            case 'wall-tile':
                this.gridArray[row][col] = TileType.Wall;
                break;
            case 'water-tile':
                this.gridArray[row][col] = TileType.Water;
                break;
            case 'door-tile':
                this.gridArray[row][col] = this.gridArray[row][col] === TileType.ClosedDoor ? TileType.OpenDoor : TileType.ClosedDoor;
                break;
            default:
                break;
        }
    }

    resetGrid() {
        this.gridArray = this.createNewMap();
    }

    removeTile(event: MouseEvent, row: number, col: number) {
        event.preventDefault();
        this.gameObjectManagerService.selectedTile = { row, col };
        const gameObject = this.gameObjectManagerService.getGameObjectOnTile(row, col);

        if (gameObject?.id != 0 && gameObject) {
            this.gameObjectManagerService.removeObjectFromGrid(gameObject);
        } else if (this.gridArray[row][col] !== 1) {
            this.gridArray[row][col] = 1;
        }
    }
    // event.button -> 0: left click ; 1: middle click ; 2: right click

    onMouseDown(event: MouseEvent, row: number, col: number) {
        if (event.button === 0) {
            this.isMouseDown = true;
            this.onTileClick(row, col);
        }
    }

    onMouseUp() {
        this.isMouseDown = false;
    }

    onMouseMove(row: number, col: number) {
        if (this.isMouseDown) {
            this.onTileClick(row, col);
        }
    }
    ngOnDestroy() {
        this.toolService.selectedTile = '';
    }
}
