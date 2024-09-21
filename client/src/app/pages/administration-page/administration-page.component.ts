import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';

export interface Game {
    src: string;
    name: string;
    size: number;
    description: string;
    mode: string;
    date: string;
    visibility: boolean;
}

@Component({
    selector: 'app-administration-page',
    standalone: true,
    templateUrl: './administration-page.component.html',
    styleUrls: ['./administration-page.component.scss'],
    imports: [CommonModule, RouterLink, GameListComponent],
})
export class AdministrationPageComponent {
    constructor(public dialog: MatDialog) {}
}
