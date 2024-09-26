import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RouterLink } from '@angular/router';
import { EditionGameGridComponent } from '@app/components/edition-game-grid/edition-game-grid.component';
import { EditionToolbarComponent } from '@app/components/edition-toolbar/edition-toolbar.component';
import { EditorObjectsContainerComponent } from '@app/components/editor-objects-container/editor-objects-container.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP } from '@app/constants';
import { Game } from '@app/interfaces/game';
import { SaveGameService } from '@app/services/save-game.service';
import html2canvas from 'html2canvas';

@Component({
    selector: 'app-map-creation-page',
    standalone: true,
    templateUrl: './map-creation-page.component.html',
    styleUrls: ['./map-creation-page.component.scss'],
    providers: [EditionGameGridComponent, GameListComponent],
    imports: [MatButtonToggleModule, EditorObjectsContainerComponent, FormsModule, RouterLink, EditionGameGridComponent, EditionToolbarComponent],
})
export class MapCreationPageComponent {
    @Input() selectedSize: string = 'small';
    @Output() selectedSizeChange = new EventEmitter<string>();
    randomItemCount: number = NB_ITEMS_SMALL_MAP;
    spawnPointCount: number = NB_ITEMS_SMALL_MAP;
    resetTrigger: boolean = false;
    @ViewChild('gameGrid') canvas: ElementRef<HTMLDivElement>;

    game: Game;

    constructor(
        private adminGamePage: GameListComponent,
        private gameGridComponent: EditionGameGridComponent,
        private saveGameSerivce: SaveGameService,
    ) {}

    onSelectionChange(event: { value: string }) {
        this.selectedSize = event.value;
        this.updateItemCount();
        this.selectedSizeChange.emit(this.selectedSize);
        this.resetTrigger = false;
    }

    updateItemCount() {
        switch (this.selectedSize) {
            case 'small':
                this.randomItemCount = NB_ITEMS_SMALL_MAP;
                this.spawnPointCount = NB_ITEMS_SMALL_MAP;
                this.selectedSize = 'small';
                break;
            case 'medium':
                this.randomItemCount = NB_ITEMS_MEDIUM_MAP;
                this.spawnPointCount = NB_ITEMS_MEDIUM_MAP;
                this.selectedSize = 'medium';
                break;
            case 'large':
                this.randomItemCount = NB_ITEMS_LARGE_MAP;
                this.spawnPointCount = NB_ITEMS_LARGE_MAP;
                this.selectedSize = 'large';
                break;
        }
    }

    handleReset() {
        this.resetTrigger = true;
        setTimeout(() => (this.resetTrigger = false), 0);
    }

    takeScreenshot() {
        html2canvas(this.canvas.nativeElement).then((canvas) => {
            canvas.height = 80;
            canvas.width = 80;
            const base64Image = canvas.toDataURL('mapScreenshot.png');

            const mapName = <HTMLInputElement>document.getElementById('mapName');
            const mapDescription = <HTMLTextAreaElement>document.getElementById('mapDescription');
            //TODO:
            // Need to find a way to get the updated informations for the sizes, the gridArray and the itemArray.
            let nbPlayersNewMap: number = 0;
            switch (this.gameGridComponent.height) {
                case 10:
                    nbPlayersNewMap = 2;
                    break;
                case 15:
                    nbPlayersNewMap = 4;
                    break;
                case 20:
                    nbPlayersNewMap = 6;
                    break;
            }
            if (this.adminGamePage.gameSelected == null) {
                // need a new way to check if it's a new map or not
                // if game doesn't exist, will have to get some info from admin page
                this.game = {
                    _id: '1', //idk how to make it actually random
                    name: mapName.value,
                    description: mapDescription.value,
                    visible: true, // by default true when creating a new map
                    mode: 'normal', // comes from popUp component
                    nbPlayers: nbPlayersNewMap,
                    image: base64Image,
                    dimension: this.gameGridComponent.height.toString(),
                    tiles: this.gameGridComponent.gridArray,
                    itemPlacement: this.gameGridComponent.itemArray, // doesn't exist yet in the component
                    isSelected: false,
                    lastModification: new Date(),
                };
                this.saveGameSerivce.addNewGame(this.game).subscribe((data) => (this.game._id = data._id));
            } else {
                this.game = {
                    _id: '2',
                    name: mapName.value,
                    description: mapDescription.value,
                    visible: this.adminGamePage.gameSelected.visible,
                    mode: this.adminGamePage.gameSelected.mode,
                    nbPlayers: nbPlayersNewMap,
                    image: base64Image,
                    dimension: this.gameGridComponent.height.toString(),
                    tiles: [
                        [1, 2, 3, 4, 1, 2, 3, 5, 6, 7],
                        [1, 2, 3, 4, 1, 2, 3, 5, 6, 7],
                        [1, 2, 3, 4, 1, 2, 3, 5, 6, 7],
                        [1, 2, 3, 4, 1, 2, 3, 5, 6, 7],
                        [1, 2, 3, 4, 1, 2, 3, 5, 6, 7],
                        [1, 2, 3, 4, 1, 2, 3, 5, 6, 7],
                        [1, 2, 3, 4, 1, 2, 3, 5, 6, 7],
                        [1, 2, 3, 4, 1, 2, 3, 5, 6, 7],
                        [1, 2, 3, 4, 1, 2, 3, 5, 6, 7],
                        [1, 2, 3, 4, 1, 2, 3, 5, 6, 7],
                    ], //this.gameGridComponent.gridArray,
                    itemPlacement: [
                        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        [0, 0, 0, 0, 0, 0, 3, 0, 0, 0],
                        [0, 0, 0, 0, 4, 0, 6, 0, 7, 0],
                        [7, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        [7, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        [7, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        [7, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        [7, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                    ], //this.gameGridComponent.itemArray, // doesn't exist yet in the game grid component
                    isSelected: false,
                    lastModification: new Date(),
                };
                this.saveGameSerivce.replaceExistingMap(this.game).subscribe((data) => (this.game._id = data._id));
            }
        });
    }
}
