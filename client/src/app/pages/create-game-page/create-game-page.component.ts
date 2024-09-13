import { Component } from '@angular/core';
import { GameListComponent } from '@app/components/game-list/game-list.component';

@Component({
    selector: 'app-create-game-page',
    standalone: true,
    imports: [GameListComponent],
    templateUrl: './create-game-page.component.html',
    styleUrl: './create-game-page.component.scss',
})
export class CreateGamePageComponent {}
