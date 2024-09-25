import { CommonModule, NgClass } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
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

    constructor(
        private gameListService: GameListService,
        private snackBar: MatSnackBar,
    ) {}

    selectGame(game: Game) {
        this.gameListService.setSelectedGame(this.usingPage, game, this.games);
    }

    getGames() {
        this.gameListService.getGames(this.usingPage).subscribe({
            next: (gamesFetched: Game[]) => {
                this.games = gamesFetched;
            },
        });
    }
    getTrimedDate(game: Game) {
        const date = new Date(game.lastModification);

        return (
            date.getFullYear() +
            '-' +
            String(date.getMonth() + 1).padStart(2, '0') +
            '-' +
            String(date.getDate()).padStart(2, '0') +
            ' ' +
            String(date.getHours()).padStart(2, '0') +
            ':' +
            String(date.getMinutes()).padStart(2, '0')
        );
    }

    ngOnInit() {
        this.getGames();
        this.gameListService.selectedGame$.subscribe((selectedGame) => {
            this.gameSelected = selectedGame;
        });
    }

    changeVisibility(game: Game) {
        this.gameListService.changeVisibility(game).subscribe({
            next: (result: boolean) => {
                if (result === false) {
                    this.showErrorMessage();
                }
            },
        });
    }

    deleteGame(game: Game) {
        this.gameListService.deleteGame(game).subscribe({
            next: (result: boolean) => {
                if (result) {
                    this.refreshGameList();
                } else {
                    this.showErrorMessage();
                }
            },
        });
    }

    showErrorMessage() {
        this.snackBar.open('Jeu déjà supprimé par un autre utilisateur', 'Fermer', {
            duration: 4000,
        });
    }

    refreshGameList() {
        this.gameListService.getAllGames().subscribe((games) => {
            this.games = games;
        });
    }
}
