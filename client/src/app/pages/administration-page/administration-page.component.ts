import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { CreationDialogComponent } from '@app/components/creation-dialog/creation-dialog.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { ErrorMessages, HEIGHT_DIALOG, WIDTH_DIALOG } from '@app/constants';
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
    @ViewChild(GameListComponent) gameListComponent!: GameListComponent;

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
                next: (response: Game | string[]) => {
                    if (Array.isArray(response)) {
                        this.errorWhileImportingGame(response as string[]);
                    } else {
                        this.gameSuccessfullyImported();
                    }
                },
                error: (err: Error) => {
                    console.error("Erreur lors de l'importation:", err);
                    // Affichez un message d'erreur dans l'interface utilisateur
                },
            });
        }
        input.value = '';
    }

    errorWhileImportingGame(errorMessages: string[]): void {
        if (errorMessages.length === 1 && errorMessages[0] === ErrorMessages.NameAlreadyExists) {
            const dialogRef = this.dialog.open(SimpleDialogComponent, {
                disableClose: true,
                data: {
                    title: "Erreur lors de l'importation",
                    messages: ['Un jeu portant ce nom existe déjà. Veuillez sélectionner un autre nom.'],
                    options: ['Annuler', 'Modifier'],
                    confirm: true,
                    isInput: true,
                },
            });
            dialogRef.afterClosed().subscribe((result) => {
                if (result.action === 'right' && result.input.trim() !== '') {
                    this.saveGameService.saveImportedGameWithNewName(result.input.trim()).subscribe({
                        next: () => {
                            this.gameListComponent.refreshGameList();
                        },
                        error: () => {
                            this.errorWhileImportingGame([ErrorMessages.NameAlreadyExists]);
                        },
                    });
                }
            });
        } else {
            const dialogRef = this.dialog.open(SimpleDialogComponent, {
                disableClose: true,
                data: {
                    title: "Erreur lors de l'importation",
                    messages: errorMessages,
                    options: ['OK'],
                },
            });
            dialogRef.afterClosed();
        }
    }

    gameSuccessfullyImported(): void {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Importation réussie',
                messages: ['Le jeu a été importé avec succès!'],
                options: ['OK'],
            },
        });
        dialogRef.afterClosed().subscribe(() => {
            this.gameListComponent.refreshGameList();
        });
    }
}
