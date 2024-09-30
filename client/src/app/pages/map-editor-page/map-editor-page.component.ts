import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { GameObjectsContainerComponent } from '@app/components/map-editor/game-objects-container/game-objects-container.component';
import { ToolbarComponent } from '@app/components/map-editor/toolbar/toolbar.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { MAX_LEN_MAP_DESCRIPTION, MAX_LEN_MAP_TITLE } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';

@Component({
    selector: 'app-map-editor-page',
    standalone: true,
    templateUrl: './map-editor-page.component.html',
    styleUrls: ['./map-editor-page.component.scss'],
    imports: [MatButtonToggleModule, GameObjectsContainerComponent, FormsModule, RouterLink, GameGridComponent, ToolbarComponent],
})
export class MapEditorPageComponent implements OnInit {
    @Input() selectedSize: string | null;
    @Output() selectedSizeChange = new EventEmitter<string>();

    mapName: string = '';
    mapDescription: string = '';

    maxLenMapTitle = MAX_LEN_MAP_TITLE;
    maxLenMapDescription = MAX_LEN_MAP_DESCRIPTION;

    resetTrigger: boolean = false;
    saveTrigger: boolean = false;

    constructor(
        private dialog: MatDialog,
        private router: Router,
        private gameCreationService: GameCreationService,
        private gameObjectService: GameObjectService,
    ) {
        this.selectedSize = gameCreationService.getStoredSize();
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

    ngOnInit(): void {
        if (!this.gameCreationService.sizeSubject.value) {
            this.router.navigate(['/administration']);
        }
    }
}
