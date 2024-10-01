import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ACCESS_CODE_LENGTH, MAX_ACCESS_CODE_VALUE } from '@app/constants';
import { Map } from '@app/interfaces/map';
import { GameListService } from '@app/services/game-list.service';

@Component({
    selector: 'app-waiting-page',
    standalone: true,
    imports: [RouterLink, CommonModule],
    templateUrl: './waiting-page.component.html',
    styleUrl: './waiting-page.component.scss',
})
export class WaitingPageComponent implements OnInit {
    accessCode: string = '';
    maxRandom = MAX_ACCESS_CODE_VALUE;
    chosenGame: Map;
    private readonly accesCodeLength = ACCESS_CODE_LENGTH;

    constructor(
        private gameListService: GameListService,
        private router: Router,
    ) {
        this.gameListService.chosenGameSubject.subscribe((game: Map | null) => {
            if (game) {
                this.chosenGame = game;
            }
        });
    }

    ngOnInit() {
        this.accessCode = this.generateAccesCode();
        if (!this.gameListService.chosenGameSubject.getValue()) {
            this.router.navigate(['/game-creation']);
        }
    }

    generateAccesCode(): string {
        const code = Math.floor(Math.random() * this.maxRandom);
        return code.toString().padStart(this.accesCodeLength, '0');
    }
}
