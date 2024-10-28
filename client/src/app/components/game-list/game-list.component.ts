import { CommonModule, NgClass } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MESSAGE_DURATION_ERROR, PAD_LENGTH, SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameListService } from '@app/services/game-list/game-list.service';
import { MapEditorService } from '@app/services/map-editor/map-editor.service';
import { Game } from '@common/game';

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
    private mapEditorService = inject(MapEditorService);

    constructor(
        private gameListService: GameListService,
        private snackBar: MatSnackBar,
        private router: Router,
        private gameCreationService: GameCreationService,
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
            duration: MESSAGE_DURATION_ERROR,
        });
    }

    editGame(game: Game) {
        this.mapEditorService.setMapToEdit(game);
        this.gameCreationService.setSelectedSize(this.convertMapDimension(game));
        this.gameCreationService.isNewGame = false;
        this.gameCreationService.loadedTiles = game.tiles;
        this.gameCreationService.loadedObjects = game.itemPlacement;

        this.gameCreationService.loadedMapName = game.name;
        this.gameCreationService.loadedMapDescription = game.description;

        this.selectGame(game); // not sure if necessary

        this.router.navigate(['/edit-map']);
    }

    convertMapDimension(game: Game): string {
        if (game.dimension === SIZE_SMALL_MAP) {
            return 'small';
        } else if (game.dimension === SIZE_MEDIUM_MAP) {
            return 'medium';
        } else if (game.dimension === SIZE_LARGE_MAP) {
            return 'large';
        } else {
            return 'none';
        }
    }

    refreshGameList() {
        this.gameListService.getAllGames().subscribe((games) => {
            this.games = games;
        });
    }
}
