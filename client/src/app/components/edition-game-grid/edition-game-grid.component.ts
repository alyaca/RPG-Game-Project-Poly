import { Component } from '@angular/core';

@Component({
    selector: 'app-edition-game-grid',
    standalone: true,
    imports: [],
    templateUrl: './edition-game-grid.component.html',
    styleUrl: './edition-game-grid.component.scss',
})
export class EditionGameGridComponent {
    // Default values for the map size, representing the smallest size available
    gridArray: Array<number>;
    height: number = 10;
    width: number = 10;

    constructor() {
        this.gridArray = Array(this.height * this.width).fill(1);
    }
}
