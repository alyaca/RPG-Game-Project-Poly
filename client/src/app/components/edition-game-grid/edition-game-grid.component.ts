import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { SIZE_SMALL_MAP } from '@app/constants';
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
    imports: [],
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

    constructor(private toolService: ToolService) {}

    get selectedTile() {
        return this.toolService.getSelectedTile();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['selectedSize']) {
            this.updateDimensions();
            this.gridArray = this.createNewMap();
        }
        if (changes['resetTrigger'] && this.resetTrigger) {
            this.resetGrid();
        }
    }

    updateDimensions() {
        if (this.selectedSize === 'small') {
            this.height = 10;
            this.width = 10;
        } else if (this.selectedSize === 'medium') {
            this.height = 15;
            this.width = 15;
        } else if (this.selectedSize === 'large') {
            this.height = 20;
            this.width = 20;
        } else {
            alert('invalid map size chosen');
        }
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
        if (this.gridArray[row][col] !== 1) {
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
