import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { PopUpComponent } from '@app/components/popUp/popUp.component';

@Component({
    selector: 'app-administration-page',
    standalone: true,
    templateUrl: './administration-page.component.html',
    styleUrls: ['./administration-page.component.scss'],
    imports: [CommonModule, RouterLink, GameListComponent, MatDialogModule],
})
export class AdministrationPageComponent {
    constructor(private dialog: MatDialog) {}
    openPopUp(): void {
        this.dialog.open(PopUpComponent, {
            width: '400px',
            height: '250px',
        });
    }
}
