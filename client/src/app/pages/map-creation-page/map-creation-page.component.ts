import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EditionGameGridComponent } from '@app/components/edition-game-grid/edition-game-grid.component';
import { EditionToolbarComponent } from '@app/components/edition-toolbar/edition-toolbar.component';

@Component({
    selector: 'app-edition-page',
    standalone: true,
    imports: [RouterLink, EditionGameGridComponent, EditionToolbarComponent],
    templateUrl: './map-creation-page.component.html',
    styleUrl: './map-creation-page.component.scss',
})
export class MapCreationPageComponent {}
