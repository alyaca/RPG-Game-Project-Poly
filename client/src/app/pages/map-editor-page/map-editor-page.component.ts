import { Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { GameObjectsContainerComponent } from '@app/components/map-editor/game-objects-container/game-objects-container.component';
import { ToolbarComponent } from '@app/components/map-editor/toolbar/toolbar.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { CHECK_BEFORE_SAVING_DELAY, MAX_LEN_MAP_DESCRIPTION, MAX_LEN_MAP_TITLE } from '@app/constants';
import { Info } from '@app/interfaces/info';
import { GameCreationService } from '@app/services/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { MapValidatorService } from '@app/services/map-validator/map-validator.service';
import { SaveGameService } from '@app/services/save-game.service';
import html2canvas from 'html2canvas';

@Component({
    selector: 'app-map-editor-page',
    standalone: true,
    templateUrl: './map-editor-page.component.html',
    styleUrls: ['./map-editor-page.component.scss'],
    providers: [GameListComponent, GameGridComponent],
    imports: [GameObjectsContainerComponent, FormsModule, RouterLink, GameGridComponent, ToolbarComponent],
})
export class MapEditorPageComponent implements OnInit {
    @Input() selectedSize: string | null;
    @Output() selectedSizeChange = new EventEmitter<string>();
    @ViewChild('gameGrid') canvas: ElementRef<HTMLDivElement>;

    mapName: string = '';
    mapDescription: string = '';
    items: number[][];
    tiles: number[][];
    height: number;
    baseImage: string;

    maxLenMapTitle = MAX_LEN_MAP_TITLE;
    maxLenMapDescription = MAX_LEN_MAP_DESCRIPTION;

    resetTrigger: boolean = false;
    saveTrigger: boolean = false;

    infoTransferred: Info;

    private adminGamePage = inject(GameListComponent);
    private saveGameService = inject(SaveGameService);
    private mapValidator = inject(MapValidatorService);

    constructor(
        private dialog: MatDialog,
        private router: Router,
        private gameCreationService: GameCreationService,
        private gameObjectService: GameObjectService,
    ) {
        this.selectedSize = this.gameCreationService.getStoredSize();
    }

    setGrid(newGrid: number[][]) {
        this.tiles = newGrid;
    }

    setItems(newItemPlacement: number[][]) {
        this.items = newItemPlacement;
    }

    setHeight(newHeight: number) {
        this.height = newHeight;
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDragEnd() {
        this.gameObjectService.isDraggingFromContainer = false;
    }

    onDropOutside(event: DragEvent) {
        event.preventDefault();
        const gameObject = this.gameObjectService.draggedObject;
        if (this.gameObjectService.isDraggingFromContainer) {
            return;
        }
        if (gameObject?.id) {
            this.gameObjectService.removeObjectFromGrid(gameObject);
        }
    }

    handleReset() {
        this.resetTrigger = true;
        this.updateMapName('');
        this.updateMapDescription('');
        setTimeout(() => (this.resetTrigger = false), 0);
    }

    handleSave() {
        this.startSaving();
        this.saveTrigger = true;
        setTimeout(() => (this.saveTrigger = false), 0);
    }

    handleExit() {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Quitter cette page?',
                messages: ['Toutes modifications non enregistrés seront perdues, êtes-vous certain de vouloir quitter?'],
                options: ['Quitter', 'Rester'],
                confirm: true,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'left') {
                this.router.navigate(['/administration']);
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
        html2canvas(this.canvas.nativeElement, { scale: 0.2 }).then((canvas) => {
            this.baseImage = canvas.toDataURL();
            this.infoTransferred = {
                image: this.baseImage,
                name: this.mapName,
                description: this.mapDescription,
                grid: this.tiles,
                items: this.items,
                height: this.height,
            };
            setTimeout(() => {
                if (this.mapValidator.validMap) {
                    this.saveGameService.saveGame(this.infoTransferred, this.adminGamePage.gameSelected);
                }
            }, CHECK_BEFORE_SAVING_DELAY);
        });
    }

    ngOnInit() {
        if (!this.gameCreationService.sizeSubject.value) {
            this.router.navigate(['/administration']);
        }
    }
}
