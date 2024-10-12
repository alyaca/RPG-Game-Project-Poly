import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-temporary-dialog',
  standalone: true,
  imports: [],
  templateUrl: './temporary-dialog.component.html',
  styleUrl: './temporary-dialog.component.scss'
})
export class TemporaryDialogComponent {
  @Input() message = '';
  duration = 1500; 
  isVisible = false;

  show(message: string): void {
    this.message = message;
    this.isVisible = true;

    setTimeout(() => {
      this.isVisible = false;
    }, this.duration);
  }
}
