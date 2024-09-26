import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { Game } from '@app/interfaces/game';
import { SaveGameService } from '@app/services/save-game.service';
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
    itemArray: number[][]; // will have to store the items present on the map
    height: number = SIZE_SMALL_MAP;
    width: number = SIZE_SMALL_MAP;

    selectedRow: number = 0;
    selectedCol: number = 0;

    isMouseDown: boolean = false;

    constructor(
        private toolService: ToolService,
        private saveGameService: SaveGameService,
    ) {}

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

    saveGame(image: string, mapName: string, mapDescription: string, selectedMap: Game | null) {
        if (selectedMap == null) {
            let playerNumber = 2;
            switch (this.height) {
                case 10: {
                    playerNumber = 2;
                    break;
                }
                case 15: {
                    playerNumber = 4;
                    break;
                }
                case 20: {
                    playerNumber = 6;
                    break;
                }
            }
            const mapToStore = {
                name: mapName,
                description: mapDescription,
                visible: true,
                mode: 'normal', //will have to get it from admin
                nbPlayers: playerNumber,
                image: image,
                tiles: this.gridArray,
                dimension: this.height, // will have to get it from admin, consequently, the nb of players will also change.
                itemPlacement: this.itemArray,
                isSelected: false,
                lastModification: new Date(),
            };
            this.saveGameService.addNewGame(mapToStore).subscribe();
        } else {
            const mapToReplace = {
                name: mapName,
                description: mapDescription,
                visible: selectedMap.visible,
                mode: selectedMap.mode,
                nbPlayers: selectedMap.nbPlayers,
                image: image,
                tiles: this.gridArray,
                dimension: selectedMap.dimension,
                itemPlacement: this.itemArray,
                isSelected: false,
                lastModification: new Date(),
            };
            this.saveGameService.replaceGame(selectedMap._id, mapToReplace).subscribe();
        }
    }
}
