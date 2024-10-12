import { CommonModule, NgClass } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MESSAGE_DURATION_ERROR, PAD_LENGTH } from '@app/constants';
import { Map } from '@app/interfaces/map';
import { GameListService } from '@app/services/game-list.service';
import { MapEditorService } from '@app/services/map-editor.service';

@Component({
    selector: 'app-game-list',
    standalone: true,
    imports: [CommonModule, NgClass],
    templateUrl: './game-list.component.html',
    styleUrl: './game-list.component.scss',
})
export class GameListComponent implements OnInit {
    @Input() usingPage: string = '';
    games: Map[] = [];
    gameSelected: Map | null = null;
    private gameGridService = inject(MapEditorService);

    constructor(
        private gameListService: GameListService,
        private snackBar: MatSnackBar,
        private router: Router,
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

    getTrimedDate(game: Map) {
        const date = new Date(game.lastModification);

        return (
            date.getFullYear() +
            '-' +
            String(date.getMonth() + 1).padStart(PAD_LENGTH, '0') +
            '-' +
            String(date.getDate()).padStart(PAD_LENGTH, '0') +
            ' ' +
            String(date.getHours()).padStart(PAD_LENGTH, '0') +
            ':' +
            String(date.getMinutes()).padStart(PAD_LENGTH, '0')
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
            duration: MESSAGE_DURATION_ERROR,
        });
    }

    editGame(game: Map) {
        this.gameGridService.setMapToEdit(game);
        this.router.navigate(['/edit-map']);
    }

    refreshGameList() {
        this.gameListService.getAllGames().subscribe((games) => {
            this.games = games;
        });
    }
}
