import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Router, RouterLink } from '@angular/router';
import { EditionGameGridComponent } from '@app/components/edition-game-grid/edition-game-grid.component';
import { EditionToolbarComponent } from '@app/components/edition-toolbar/edition-toolbar.component';
import { EditorObjectsContainerComponent } from '@app/components/editor-objects-container/editor-objects-container.component';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP } from '@app/constants';

import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';

@Component({
    selector: 'app-map-creation-page',
    standalone: true,
    templateUrl: './map-creation-page.component.html',
    styleUrls: ['./map-creation-page.component.scss'],
    imports: [MatButtonToggleModule, EditorObjectsContainerComponent, FormsModule, RouterLink, EditionGameGridComponent, EditionToolbarComponent],
})
export class MapCreationPageComponent {
    @Input() selectedSize: string = 'small';
    @Output() selectedSizeChange = new EventEmitter<string>();

    mapName: string = '';
    mapDescription: string = '';

    randomItemCount: number = NB_ITEMS_SMALL_MAP;
    spawnPointCount: number = NB_ITEMS_SMALL_MAP;
    resetTrigger: boolean = false;
    saveTrigger: boolean = false;

    constructor(
        private dialog: MatDialog,
        private router: Router,
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
