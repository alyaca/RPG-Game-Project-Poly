import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RouterLink } from '@angular/router';
import { EditionGameGridComponent } from '@app/components/edition-game-grid/edition-game-grid.component';
import { EditionToolbarComponent } from '@app/components/edition-toolbar/edition-toolbar.component';
import { EditorObjectsContainerComponent } from '@app/components/editor-objects-container/editor-objects-container.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP } from '@app/constants';
import { Info } from '@app/interfaces/info';
import { SaveGameService } from '@app/services/save-game.service';
import html2canvas from 'html2canvas';

@Component({
    selector: 'app-map-creation-page',
    standalone: true,
    templateUrl: './map-creation-page.component.html',
    styleUrls: ['./map-creation-page.component.scss'],
    providers: [EditionGameGridComponent, GameListComponent, SaveGameService],
    imports: [
        GameListComponent,
        MatButtonToggleModule,
        EditorObjectsContainerComponent,
        FormsModule,
        RouterLink,
        EditionGameGridComponent,
        EditionToolbarComponent,
    ],
})
export class MapCreationPageComponent {
    @Input() selectedSize: string = 'small';
    @Output() selectedSizeChange = new EventEmitter<string>();
    @ViewChild('gameGrid') canvas: ElementRef<HTMLDivElement>;
    @ViewChild('mapDescription') mapDescription: ElementRef<HTMLTextAreaElement>;
    @ViewChild('mapName') mapName: ElementRef<HTMLInputElement>;
    grid: number[][];
    items: number[][];
    height: number;
    baseImage: string;
    randomItemCount: number = NB_ITEMS_SMALL_MAP;
    spawnPointCount: number = NB_ITEMS_SMALL_MAP;
    resetTrigger: boolean = false;

    infoTransferred: Info;

    constructor(
        private gameList: GameListComponent,
        private saveGameService: SaveGameService,
    ) {}

    setGrid(newGrid: number[][]) {
        this.grid = newGrid;
    }

    setHeight(newHeight: number) {
        this.height = newHeight;
    }

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

    startSaving() {
        html2canvas(this.canvas.nativeElement, { scale: 0.25 }).then((canvas) => {
            this.baseImage = canvas.toDataURL();
            this.infoTransferred = {
                image: this.baseImage,
                name: this.mapName.nativeElement.value,
                description: this.mapDescription.nativeElement.value,
                grid: this.grid,
                items: this.items,
                height: this.height,
            };
            this.saveGameService.saveGame(this.infoTransferred, this.gameList.gameSelected);
        });
    }
}
