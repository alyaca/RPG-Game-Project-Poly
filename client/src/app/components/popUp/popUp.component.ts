import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
    selector: 'app-pop-up',
    templateUrl: './popUp.component.html',
    styleUrls: ['./popUp.component.scss'],
})
export class PopUpComponent {
    constructor(
        public dialogRef: MatDialogRef<PopUpComponent>,
        private router: Router,
    ) {}
    close(): void {
        this.dialogRef.close();
    }

    changePage(): void {
        this.router.navigate(['/edit-map']);
        this.dialogRef.close();
    }
}
