import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-temporary-dialog',
    standalone: true,
    imports: [],
    templateUrl: './temporary-dialog.component.html',
    styleUrl: './temporary-dialog.component.scss',
})
export class TemporaryDialogComponent {
    @Input() message = '';
    isVisible = false;

    show(message: string, duration: number): void {
        this.message = message;
        this.isVisible = true;

        setTimeout(() => {
            this.isVisible = false;
        }, duration);
    }
}
