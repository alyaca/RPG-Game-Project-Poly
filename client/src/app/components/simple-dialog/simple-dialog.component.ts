import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { SimpleDialogMessageComponent } from '@app/components/simple-dialog-message/simple-dialog-message.component';

@Component({
    selector: 'app-simple-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, SimpleDialogMessageComponent],
    templateUrl: './simple-dialog.component.html',
    styleUrl: './simple-dialog.component.scss',
})
export class SimpleDialogComponent {
    dialogTitle: string = '';
    options: string[] = ['', ''];

    constructor(
        public dialogRef: MatDialogRef<SimpleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { messages: string[]; title: string; confirm: boolean; options: string[] },
        private router: Router,
    ) {
        this.options = data.options;
    }

    onClose() {
        this.dialogRef.close(this.data.confirm ? 'left' : 'close');
        if (this.data.title === 'Sauvegarde réussie') {
            this.router.navigate(['/administration']);
        }
    }

    onCancel() {
        this.dialogRef.close('right');
    }
}
