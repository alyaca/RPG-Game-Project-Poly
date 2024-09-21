import { CommonModule, NgClass } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Game } from '@app/interfaces/game';
import { GameListService } from '@app/services/game-list.service';

@Component({
    selector: 'app-game-list',
    standalone: true,
    imports: [CommonModule, NgClass],
    templateUrl: './game-list.component.html',
    styleUrl: './game-list.component.scss',
})
export class GameListComponent implements OnInit {
    @Input() usingPage: string = '';
    games: Game[] = [];
    gameSelected: Game | null = null;

    constructor(private gameListService: GameListService) {}

    selectGame(game: Game) {
        if (this.usingPage === 'game-list') {
            if (game.isSelected) {
                this.gameListService.deselectGame(this.games);
            } else {
                this.gameListService.selectGame(game, this.games);
            }
        }
    }

    getGames() {
        if (this.usingPage === 'game-list') {
            this.gameListService.getAllVisibleMaps().subscribe({
                next: (gamesFetched: Game[]) => {
                    this.games = gamesFetched;
                },
            });
        } else {
            this.gameListService.getAllGames().subscribe({
                next: (gamesFetched: Game[]) => {
                    this.games = gamesFetched;
                },
            });
        }
    }

    ngOnInit() {
        this.getGames();
        this.gameListService.selectedGame$.subscribe((selectedGame) => {
            this.gameSelected = selectedGame;
        });
    }
    changeVisibility(game: Game) {
        this.gameListService.changeVisibility(game);
    }
}
