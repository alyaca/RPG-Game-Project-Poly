import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';

@Component({
    selector: 'app-create-game-page',
    standalone: true,
    imports: [GameListComponent, RouterLink],
    templateUrl: './create-game-page.component.html',
    styleUrl: './create-game-page.component.scss',
})
export class CreateGamePageComponent {}
