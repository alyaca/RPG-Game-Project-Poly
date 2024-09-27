import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { SIZE_SMALL_MAP } from '@app/constants';
import { ToolService } from '@app/services/tool.service';
import { MapValidatorService, TileType } from '@app/services/map-validator.service';

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
    @Input() saveTrigger: boolean = false;

    @Input() mapName: string;
    @Input() mapDescription: string;

    tilesGrid: number[][];
    height: number = SIZE_SMALL_MAP;
    width: number = SIZE_SMALL_MAP;

    selectedRow: number = 0;
    selectedCol: number = 0;

    isMouseDown: boolean = false;

    constructor(
        private toolService: ToolService,
        private mapValidatorService: MapValidatorService,
    ) {}

    get selectedTile(): string {
        return this.toolService.getSelectedTile();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.resetTrigger) {
            this.resetGrid();
        }
        if (changes.saveTrigger && this.saveTrigger) {
            this.mapValidatorService.validateMap(this.tilesGrid, this.mapName, this.mapDescription);
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
        return Array.from({ length: this.height }, () => Array(this.width).fill(TileType.Ground));
    }

    onTileClick(row: number, col: number) {
        this.selectedRow = row;
        this.selectedCol = col;

        switch (this.selectedTile) {
            case 'ice-tile':
                this.tilesGrid[row][col] = TileType.Ice;
                break;
            case 'wall-tile':
                this.tilesGrid[row][col] = TileType.Wall;
                break;
            case 'water-tile':
                this.tilesGrid[row][col] = TileType.Water;
                break;
            case 'door-tile':
                if (this.isPointingNonDoorTile(row, col)) {
                    this.tilesGrid[row][col] = TileType.ClosedDoor;
                }
                break;
            default:
                break;
        }
    }

    resetGrid() {
        this.tilesGrid = this.createNewMap();
    }

    removeTile(event: MouseEvent, row: number, col: number) {
        event.preventDefault();
        if (this.tilesGrid[row][col] !== TileType.Ground) {
            this.tilesGrid[row][col] = TileType.Ground;
        }
    }

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

    isPointingNonDoorTile(row: number, col: number): boolean {
        return this.tilesGrid[row][col] !== TileType.ClosedDoor && this.tilesGrid[row][col] !== TileType.OpenDoor;
    }
}
