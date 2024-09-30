import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Router, RouterLink } from '@angular/router';
import { EditionGameGridComponent } from '@app/components/edition-game-grid/edition-game-grid.component';
import { EditionToolbarComponent } from '@app/components/edition-toolbar/edition-toolbar.component';
import { EditorObjectsContainerComponent } from '@app/components/editor-objects-container/editor-objects-container.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { MAX_LEN_MAP_DESCRIPTION, MAX_LEN_MAP_TITLE, NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP } from '@app/constants';
import { Info } from '@app/interfaces/info';
import { SaveGameService } from '@app/services/save-game.service';
import html2canvas from 'html2canvas';

import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';

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

    mapName: string = '';
    mapDescription: string = '';

    maxLenMapTitle = MAX_LEN_MAP_TITLE;
    maxLenMapDescription = MAX_LEN_MAP_DESCRIPTION;

    grid: number[][];
    items: number[][];
    height: number;
    baseImage: string;
    randomItemCount: number = NB_ITEMS_SMALL_MAP;
    spawnPointCount: number = NB_ITEMS_SMALL_MAP;

    resetTrigger: boolean = false;
    saveTrigger: boolean = false;

    infoTransferred: Info;

    constructor(
        private dialog: MatDialog,
        private router: Router,
        private gameList: GameListComponent,
        private saveGameService: SaveGameService,
    ) {}

    setGrid(newGrid: number[][]) {
        this.grid = newGrid;
    }

    setItems(newItems: number[][]) {
        this.items = newItems;
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
        this.updateMapName('');
        this.updateMapDescription('');
        setTimeout(() => (this.resetTrigger = false), 0);
    }

    handleSave() {
        this.saveTrigger = true;
        setTimeout(() => (this.saveTrigger = false), 0);
    }

    handleExit() {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            data: {
                message: 'Toutes modifications non enregistrés seront perdues, êtes-vous certain de vouloir quitter?',
                confirm: true,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'leave') {
                this.router.navigate(['/admin']);
            }
        });
    }

    updateMapName(newName: string) {
        this.mapName = newName;
    }
    updateMapDescription(newDescription: string) {
        this.mapDescription = newDescription;
    }

    startSaving() {
        html2canvas(this.canvas.nativeElement, { scale: 0.25 }).then((canvas) => {
            this.baseImage = canvas.toDataURL();
            this.infoTransferred = {
                image: this.baseImage,
                name: this.mapName,
                description: this.mapDescription,
                grid: this.grid,
                items: this.items,
                height: this.height,
            };
            this.saveGameService.saveGame(this.infoTransferred, this.gameList.gameSelected);
        });
    }
}
