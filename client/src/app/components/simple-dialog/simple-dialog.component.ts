import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-simple-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    templateUrl: './simple-dialog.component.html',
    styleUrl: './simple-dialog.component.scss',
})
export class SimpleDialogComponent implements OnInit {
    dialogTitle: string = '';
    constructor(
        public dialogRef: MatDialogRef<SimpleDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { message: string; title: string; confirm: boolean },
    ) {}

    ngOnInit(): void {
        this.data.title = this.data.confirm ? 'Quitter cette page?' : this.data.title;
    }

    onClose() {
        this.dialogRef.close(this.data.confirm ? 'leave' : 'close');
    }

    onCancel() {
        this.dialogRef.close('cancel');
    }
}
