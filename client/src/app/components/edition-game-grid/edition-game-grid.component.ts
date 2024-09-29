import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { SIZE_SMALL_MAP } from '@app/constants';
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
export class EditionGameGridComponent implements OnChanges, OnDestroy {
    @Input() selectedSize: string;
    @Input() resetTrigger: boolean = false;
    @Output() gridChange = new EventEmitter<number[][]>();
    @Output() heightChange = new EventEmitter<number>();
    @Output() itemsChange = new EventEmitter<number[][]>();
    @Input() saveTrigger: boolean = false;

    @Input() mapName: string;
    @Input() mapDescription: string;

    tilesGrid: number[][]; // will have to get the grid from the map creation form
    itemArray: number[][]; // will have to store the items present on the map
    height: number = SIZE_SMALL_MAP;
    width: number = SIZE_SMALL_MAP;

    selectedRow: number = 0;
    selectedCol: number = 0;

    isMouseDown: boolean = false;

    previousRow: number | null = null;
    previousCol: number | null = null;

    constructor(
        private toolService: ToolService,
        private mapValidatorService: MapValidatorService,
        public tileService: TileService,
    ) {}

    get selectedTile(): string {
        return this.toolService.getSelectedTile();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.resetTrigger) {
            this.tilesGrid = this.tileService.resetGrid(this.height, this.tilesGrid);
            this.gridChange.emit(this.tilesGrid);
            this.heightChange.emit(this.height);
        }
        if (changes.saveTrigger && this.saveTrigger) {
            this.mapValidatorService.validateMap(this.tilesGrid, this.mapName, this.mapDescription);
        }
    }

    onTileClick(row: number, col: number) {
        if (this.isMouseDown && this.previousRow === row && this.previousCol === col) {
            return;
        }

        this.selectedRow = row;
        this.selectedCol = col;

        this.tileService.setTile(this.selectedTile, row, col, this.tilesGrid);

        this.previousRow = row;
        this.previousCol = col;
        this.gridChange.emit(this.tilesGrid);
        this.heightChange.emit(this.height);
        this.itemsChange.emit(this.itemArray); // THIS NEEDS TO BE MOVED WHERE THE ITEMS ARE PLACED TO SEND THE MATRIX TO THE PAGE
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
