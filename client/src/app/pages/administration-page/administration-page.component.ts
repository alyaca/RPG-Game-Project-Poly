import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';

@Component({
    selector: 'app-administration-page',
    standalone: true,
    templateUrl: './administration-page.component.html',
    styleUrls: ['./administration-page.component.scss'],
    imports: [CommonModule, RouterLink, GameListComponent],
})
export class AdministrationPageComponent {}
