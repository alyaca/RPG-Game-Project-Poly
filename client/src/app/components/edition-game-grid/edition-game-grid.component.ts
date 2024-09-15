import { Component } from '@angular/core';
import { SIZE_SMALL_MAP } from '@app/constants';

@Component({
    selector: 'app-edition-game-grid',
    standalone: true,
    imports: [],
    templateUrl: './edition-game-grid.component.html',
    styleUrl: './edition-game-grid.component.scss',
})
export class EditionGameGridComponent {
    gridArray: number[];
    height: number = SIZE_SMALL_MAP;
    width: number = SIZE_SMALL_MAP;

    constructor() {
        this.gridArray = Array(this.height * this.width).fill(1);
    }
}
