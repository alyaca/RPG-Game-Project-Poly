import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
    selector: 'app-pop-up',
    templateUrl: './popUp.component.html',
    styleUrls: ['./popUp.component.scss'],
})
export class PopUpComponent {
    constructor(
        public dialogRef: MatDialogRef<PopUpComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private router: Router,
    ) {}
    close(): void {
        this.dialogRef.close();
    }

    changePage(): void {
        this.router.navigate(['/edit']);
        this.dialogRef.close();
    }
}
