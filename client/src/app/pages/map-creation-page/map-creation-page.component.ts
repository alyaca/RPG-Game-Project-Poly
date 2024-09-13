import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RouterLink } from '@angular/router';
import { EditorObjectsContainerComponent } from '@app/components/editor-objects-container/editor-objects-container.component';

// TODO : Avoir un fichier séparé pour les constantes!
export const NB_ITEMS_SMALL_MAP = 2;
export const NB_ITEMS_MEDIUM_MAP = 4;
export const NB_ITEMS_LARGE_MAP = 6;

@Component({
    selector: 'app-map-creation-page',
    standalone: true,
    templateUrl: './map-creation-page.component.html',
    styleUrls: ['./map-creation-page.component.scss'],
    imports: [MatButtonToggleModule,
        EditorObjectsContainerComponent, FormsModule, RouterLink],
})
export class MapCreationPageComponent {
    mapName: string = '';
    randomItemCount: number = 2;
    spawnPointCount: number = 2;
    selectedSize: string = 'small';

    onSelectionChange(event: any) {
        this.selectedSize = event.value;
        this.updateItemCount();
    }

    updateItemCount() {
        if(this.selectedSize === 'small') {
            this.randomItemCount = NB_ITEMS_SMALL_MAP;
            this.spawnPointCount = NB_ITEMS_SMALL_MAP;
        }
        else if (this.selectedSize === 'medium') {
            this.randomItemCount = NB_ITEMS_MEDIUM_MAP;
            this.spawnPointCount = NB_ITEMS_MEDIUM_MAP;

        }
        else {
            this.randomItemCount = NB_ITEMS_LARGE_MAP;
            this.spawnPointCount = NB_ITEMS_LARGE_MAP;
        }
    }
}
