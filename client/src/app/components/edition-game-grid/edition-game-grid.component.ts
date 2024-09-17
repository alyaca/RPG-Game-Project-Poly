import { Component, Input } from '@angular/core';
import { SIZE_SMALL_MAP } from '@app/constants';
import { ToolService } from '@app/services/tool.service';

@Component({
    selector: 'app-edition-game-grid',
    standalone: true,
    imports: [],
    templateUrl: './edition-game-grid.component.html',
    styleUrl: './edition-game-grid.component.scss',
})
export class EditionGameGridComponent {
    @Input() selectedSize: string;
    @Input() resetTrigger: boolean = false;
    gridArray: number[][];
    height: number = SIZE_SMALL_MAP;
    width: number = SIZE_SMALL_MAP;

    selectedRow: number = 0;
    selectedCol: number = 0;

    isMouseDown: boolean = false; // Track if mouse is down

    constructor(private toolService: ToolService) {}

    get selectedTile() {
        return this.toolService.getSelectedTile();
    }

    ngOnChanges(changes: any) {
        if (changes['selectedSize']) {
            this.updateDimensions();
            this.gridArray = this.createNewMap(this.height, this.width);
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
            console.error('Map size not valid');
        }
    }

    getTileImage(value: number): string {
        switch (value) {
            case 1:
                return '/assets/images/tiles/GroundTile-test.jpg';
            case 2:
                return '/assets/images/tiles/ice2.jpg';
            case 3:
                return '/assets/images/tiles/WallTile-Test.jpg';
            case 4:
                return '/assets/images/tiles/WaterTile-test.jpg';
            case 5:
                return '/assets/images/tiles/closed-door.jpg';
            case 6:
                return '/assets/images/tiles/open-door.jpg';
            default:
                return '';
        }
    }

    createNewMap(n: number, m: number): number[][] {
        return Array.from({ length: this.height }, () => Array(this.width).fill(1));
    }

    onTileClick(row: number, col: number) {
        this.selectedRow = row;
        this.selectedCol = col;

        switch (this.selectedTile) {
            case 'ice-tile':
                this.gridArray[row][col] = 2;
                break;
            case 'wall-tile':
                this.gridArray[row][col] = 3;
                break;
            case 'water-tile':
                this.gridArray[row][col] = 4;
                break;
            case 'door-tile':
                if (this.gridArray[row][col] === 5) this.gridArray[row][col] = 6;
                else {
                    this.gridArray[row][col] = 5;
                }
                break;
            default:
                console.error('Tile type does not exist');
        }
    }

    resetGrid() {
        this.gridArray = this.createNewMap(this.height, this.width);
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
        if (this.isMouseDown){
            this.onTileClick(row, col);
        }
    }
}
