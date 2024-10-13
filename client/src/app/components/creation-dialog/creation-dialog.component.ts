import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MESSAGE_DURATION_SAVE_CHOICE } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation.service';

@Component({
    selector: 'app-creation-dialog',
    templateUrl: './creation-dialog.component.html',
    styleUrls: ['./creation-dialog.component.scss'],
})
export class CreationDialogComponent {
    selectedSize: string;
    selectedMode: string;

    constructor(
        public dialogRef: MatDialogRef<CreationDialogComponent>,
        private router: Router,
        private gameCreationService: GameCreationService,
        public snackBar: MatSnackBar,
    ) {}

    selectSize(size: string): void {
        this.selectedSize = size;
        this.gameCreationService.setSelectedSize(size);
    }

    selectMode(mode: string): void {
        this.selectedMode = mode;
        this.gameCreationService.setSelectedMode(mode);
    }

    isSubmitDisabled(): boolean {
        return !this.selectedMode || !this.selectedSize;
    }

    close(): void {
        this.dialogRef.close();
    }

    changePage(): void {
        if (this.isSubmitDisabled()) {
            this.snackBar.open('Veuillez choisir la taille et le mode de jeu', 'Fermer', {
                duration: MESSAGE_DURATION_SAVE_CHOICE,
            });
        } else {
            this.router.navigate(['/edit-map']);
            this.dialogRef.close();
        }
    }
}
