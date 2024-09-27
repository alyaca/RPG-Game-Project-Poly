import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { PopUpComponent } from '@app/components/popUp/popUp.component';

@Component({
    selector: 'app-administration-page',
    standalone: true,
    templateUrl: './administration-page.component.html',
    styleUrls: ['./administration-page.component.scss', '../../../common/css/game-list-page.scss'],
    imports: [CommonModule, RouterLink, GameListComponent],
})
export class AdministrationPageComponent {
    constructor(private dialog: MatDialog) {}
    openPopUp(): void {
        this.dialog.open(PopUpComponent, {
            width: '40%',
            height: '50%',
        });
    }
}
