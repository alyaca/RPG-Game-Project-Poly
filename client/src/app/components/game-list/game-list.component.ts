import { CommonModule, NgClass } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { Map } from '@app/interfaces/map';
import { GameListService } from '@app/services/game-list.service';
// import { GameGridComponent } from '../map-editor/game-grid/game-grid.component';
import { GameGridService } from '@app/services/game-grid.service';

@Component({
    selector: 'app-game-list',
    standalone: true,
    imports: [CommonModule, NgClass, RouterLink],
    templateUrl: './game-list.component.html',
    styleUrl: './game-list.component.scss',
})
export class GameListComponent implements OnInit {
    @Input() usingPage: string = '';
    games: Map[] = [];
    gameSelected: Map | null = null;

    constructor(
        private gameListService: GameListService,
        private snackBar: MatSnackBar,
        private gameGridService: GameGridService,
    ) {}

    selectGame(game: Map) {
        this.gameListService.setSelectedGame(this.usingPage, game, this.games);
    }

    getGames() {
        this.gameListService.getGames(this.usingPage).subscribe({
            next: (gamesFetched: Map[]) => {
                this.games = gamesFetched;
            },
        });
    }

    editGame(game: Map) {
        this.gameGridService.setMapToEdit(game);
    }

    getTrimedDate(game: Map) {
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
    }

    changeVisibility(game: Map) {
        this.gameListService.changeVisibility(game).subscribe({
            next: (result: boolean) => {
                if (result === false) {
                    this.showErrorMessage();
                }
            },
        });
    }

    deleteGame(game: Map) {
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
