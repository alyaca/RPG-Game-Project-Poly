import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-waiting-page',
    standalone: true,
    imports: [],
    templateUrl: './waiting-page.component.html',
    styleUrl: './waiting-page.component.scss',
})
export class WaitingPageComponent implements OnInit {
    accessCode: string = '';
    private readonly maxRandom = 10000;
    private readonly accesCodeLenght = 4;

    ngOnInit() {
        this.accessCode = this.generateAccesCode();
    }

    generateAccesCode(): string {
        const code = Math.floor(Math.random() * this.maxRandom);
        return code.toString().padStart(this.accesCodeLenght, '0');
    }
}
