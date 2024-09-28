import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
//import { SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation.service';
import { MapValidatorService } from '@app/services/map-validator.service';
import { TileService } from '@app/services/tile.service';
import { ToolService } from '@app/services/tool.service';

@Component({
    selector: 'app-edition-game-grid',
    standalone: true,
    imports: [],
    templateUrl: './edition-game-grid.component.html',
    styleUrl: './edition-game-grid.component.scss',
})
export class EditionGameGridComponent implements OnChanges, OnDestroy, OnInit {
    @Input() selectedSize: string | null = null;
    @Input() resetTrigger: boolean = false;
    @Input() saveTrigger: boolean = false;

    @Input() mapName: string;
    @Input() mapDescription: string;

    tilesGrid: number[][];
    height: number;
    width: number;

    selectedRow: number;
    selectedCol: number;

    isMouseDown: boolean = false;

    previousRow: number | null = null;
    previousCol: number | null = null;

    constructor(
        private toolService: ToolService,
        private mapValidatorService: MapValidatorService,
        public tileService: TileService,
        private gameCreationService: GameCreationService,
    ) {}

    get selectedTile(): string {
        return this.toolService.getSelectedTile();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.resetTrigger) {
            this.tilesGrid = this.tileService.resetGrid(this.height, this.tilesGrid);
        }
        if (changes.saveTrigger && this.saveTrigger) {
            this.mapValidatorService.validateMap(this.tilesGrid, this.mapName, this.mapDescription);

        }    
    }
    ngOnInit() {
        this.gameCreationService.selectedSize$.subscribe((size) => {
            this.selectedSize = size;
        });
       // this.updateDimensions();
       // this.gridArray = this.createNewMap();
    }

    /*ngOnChanges(changes: SimpleChanges) {
        if (changes['resetTrigger'] && this.resetTrigger) {
            this.resetGrid();
        }
    }*/

        //will a enlevé ça 
    /*updateDimensions() {
        if (this.selectedSize === 'small') {
            this.height = SIZE_SMALL_MAP;
            this.width = SIZE_SMALL_MAP;
        } else if (this.selectedSize === 'medium') {
            this.height = SIZE_MEDIUM_MAP;
            this.width = SIZE_MEDIUM_MAP;
        } else if (this.selectedSize === 'large') {
            this.height = SIZE_LARGE_MAP;
            this.width = SIZE_LARGE_MAP;
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
    }*/

    onTileClick(row: number, col: number) {
        if (this.isMouseDown && this.previousRow === row && this.previousCol === col) {
            return;
        }

        this.selectedRow = row;
        this.selectedCol = col;

        this.tileService.setTile(this.selectedTile, row, col, this.tilesGrid);

        this.previousRow = row;
        this.previousCol = col;
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
}
