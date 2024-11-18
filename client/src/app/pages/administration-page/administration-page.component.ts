import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { CreationDialogComponent } from '@app/components/creation-dialog/creation-dialog.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { HEIGHT_DIALOG, WIDTH_DIALOG } from '@app/constants';
import { SaveGameService } from '@app/services/save-game/save-game.service';
import { Game } from '@common/game';

@Component({
    selector: 'app-administration-page',
    standalone: true,
    templateUrl: './administration-page.component.html',
    styleUrls: ['./administration-page.component.scss', '../../../common/css/game-list-page.scss'],
    imports: [CommonModule, RouterLink, GameListComponent],
})
export class AdministrationPageComponent {
    @ViewChild('fileInput') fileInput!: ElementRef;

    constructor(
        private dialog: MatDialog,
        private saveGameService: SaveGameService,
    ) {}

    openPopUp(): void {
        this.dialog.open(CreationDialogComponent, {
            width: WIDTH_DIALOG,
            height: HEIGHT_DIALOG,
        });
    }

    importGame(): void {
        this.fileInput.nativeElement.click();
    }

    handleFileInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const files: FileList = input.files; // Récupère la liste des fichiers
            this.saveGameService.importGame(files[0]).subscribe({
                next: (newGame: Game | string[]) => {
                    if (Array.isArray(newGame)) {
                        console.error('Erreurs de validation :', newGame);
                        // Affichez les erreurs de validation dans l'interface utilisateur
                    } else {
                        console.log('Jeu importé et sauvegardé:', newGame);
                        // Mettez à jour l'interface utilisateur ou affichez un message de succès
                    }
                },
                error: (err: Error) => {
                    console.error("Erreur lors de l'importation:", err);
                    // Affichez un message d'erreur dans l'interface utilisateur
                },
            });
        }
    }
}
