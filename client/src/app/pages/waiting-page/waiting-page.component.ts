import { Component } from '@angular/core';

@Component({
    selector: 'app-waiting-page',
    standalone: true,
    imports: [],
    templateUrl: './waiting-page.component.html',
    styleUrl: './waiting-page.component.scss',
})
export class WaitingPageComponent {
    accessCode: string = '';

    ngOnInit() {
        this.accessCode = this.generateAccesCode();
    }

    generateAccesCode(): string {
        const code = Math.floor(Math.random() * 10000);
        return code.toString().padStart(4, '0');
    }
}
