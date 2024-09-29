import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MAX_ACCESS_CODE_VALUE, ACCESS_CODE_LENGTH } from '@app/constants';

@Component({
    selector: 'app-waiting-page',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './waiting-page.component.html',
    styleUrl: './waiting-page.component.scss',
})
export class WaitingPageComponent implements OnInit {
    accessCode: string = '';
    maxRandom = MAX_ACCESS_CODE_VALUE;
    private readonly accesCodeLength = ACCESS_CODE_LENGTH;

    ngOnInit() {
        this.accessCode = this.generateAccesCode();
    }

    generateAccesCode(): string {
        const code = Math.floor(Math.random() * this.maxRandom);
        return code.toString().padStart(this.accesCodeLength, '0');
    }
}
