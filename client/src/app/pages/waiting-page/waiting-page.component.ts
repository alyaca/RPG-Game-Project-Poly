import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
    chosenGame: Map;

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
        if (!this.gameListService.chosenGameSubject.getValue()) {
            this.router.navigate(['/game-creation']);
        }
    }
}
