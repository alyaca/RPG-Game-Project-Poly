import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SimpleDialogMessageComponent } from '@app/components/simple-dialog-message/simple-dialog-message.component';
import { DialogData } from '@app/interfaces/dialog-data';

@Component({
    selector: 'app-simple-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, SimpleDialogMessageComponent, FormsModule],
    templateUrl: './simple-dialog.component.html',
    styleUrl: './simple-dialog.component.scss',
})
export class SimpleDialogComponent {
    dialogTitle: string = '';
    options: string[] = ['', ''];
    inputValue: string = '';
    showError: boolean = false;

    constructor(
        private dialogRef: MatDialogRef<SimpleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        private router: Router,
    ) {
        this.options = data.options;
    }

    onClose() {
        this.dialogRef.close({
            action: this.data.confirm ? 'left' : 'close',
            input: this.data.isInput ? this.inputValue : null,
        });
        if (this.data.title === 'Sauvegarde réussie') {
            this.router.navigate(['/administration']);
        }
    }

    onCancel() {
        if (this.data.isInput && this.inputValue === '' && this.data.confirm) {
            this.showError = true;
            return;
        }
        this.dialogRef.close({
            action: 'right',
            input: this.data.isInput ? this.inputValue : null,
        });
        this.showError = false;
    }

    close() {
        this.dialogRef.close();
    }
}
