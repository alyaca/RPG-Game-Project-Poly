import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
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
        this.router.navigate(['/edit-map']);
        this.dialogRef.close();
    }
}
