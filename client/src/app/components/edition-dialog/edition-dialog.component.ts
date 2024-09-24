import { Component , Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-edition-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './edition-dialog.component.html',
  styleUrl: './edition-dialog.component.scss'
})
export class EditionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<EditionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string; confirm: boolean }
  ) {}

  onClose(): void {
    this.dialogRef.close(this.data.confirm ? 'leave' : 'close');
  }

  onCancel(): void {
    this.dialogRef.close('cancel');
  }
}
