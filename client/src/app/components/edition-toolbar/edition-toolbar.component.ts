import { Component } from '@angular/core';
import { MatButtonToggle } from '@angular/material/button-toggle';
import { EditionGameGridComponent } from '../edition-game-grid/edition-game-grid.component';

@Component({
    selector: 'app-edition-toolbar',
    standalone: true,
    imports: [EditionGameGridComponent, MatButtonToggle],
    templateUrl: './edition-toolbar.component.html',
    styleUrl: './edition-toolbar.component.scss',
})
export class EditionToolbarComponent {
    // tileTypes: Array<string> = ['water', 'ice', 'wall', 'door'];
    // tileImgPaths: Array<string> = [
    //     'assets/images/WaterTile-test.jpg',
    //     'assets/images/IceTile-test.jpg',
    //     'assets/images/WallTile-Test.jpg',
    //     'assets/images/DoorTile-test.jpg',
    // ];
}
