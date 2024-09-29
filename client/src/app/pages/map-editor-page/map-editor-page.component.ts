import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Router, RouterLink } from '@angular/router';
import { EditionGameGridComponent } from '@app/components/edition-game-grid/edition-game-grid.component';
import { EditionToolbarComponent } from '@app/components/edition-toolbar/edition-toolbar.component';
import { EditorObjectsContainerComponent } from '@app/components/editor-objects-container/editor-objects-container.component';
import { MAX_LEN_MAP_DESCRIPTION, MAX_LEN_MAP_TITLE } from '@app/constants';

import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { GameObjectService } from '@app/services/game-object/game-object.service';

@Component({
    selector: 'app-map-editor-page',
    standalone: true,
    templateUrl: './map-editor-page.component.html',
    styleUrls: ['./map-editor-page.component.scss'],
    imports: [MatButtonToggleModule, EditorObjectsContainerComponent, FormsModule, RouterLink, EditionGameGridComponent, EditionToolbarComponent],
})
export class MapEditorPageComponent {
    @Input() selectedSize: string = 'small';
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
        private gameObjectService: GameObjectService,
    ) {}

    onDragOver(event: DragEvent) {
        event.preventDefault();
    }

    onDropOutside(event: DragEvent) {
        event.preventDefault();
        const gameObject = this.gameObjectService.draggedObject;
        if (gameObject?.id) {
            this.gameObjectService.removeObjectFromGrid(gameObject);
        }
    }

    onSelectionChange(event: { value: string }) {
        this.selectedSize = event.value;
        this.selectedSizeChange.emit(this.selectedSize);
        this.resetTrigger = false;
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
}
