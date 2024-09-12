import { Component } from '@angular/core';
import { EditionGameGridComponent } from '../edition-game-grid/edition-game-grid.component';
import { ToolsButtonsComponent } from '../tools-buttons/tools-buttons.component';

@Component({
    selector: 'app-edition-toolbar',
    standalone: true,
    imports: [EditionGameGridComponent, ToolsButtonsComponent],
    templateUrl: './edition-toolbar.component.html',
    styleUrl: './edition-toolbar.component.scss',
})
export class EditionToolbarComponent {
    tileTypes: Array<string> = ['water', 'ice', 'wall', 'door'];
    //The paths will need to be changed to the real images.
    tileImgPaths: Array<string> = [
        'assets/images/WaterTile.png',
        'assets/images/Ice-Tile.jpeg',
        'assets/images/Building_Tile.jpeg',
        'assets/images/DoorTile.jpeg',
    ];

    //buttonClicked is happening.
    buttonClicked(event: string) {
        console.log('hello');
    }
}
