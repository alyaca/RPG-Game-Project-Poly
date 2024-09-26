import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { CharacterCreatorComponent } from '@app/components/character-creator/character-creator.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { Map } from '@app/interfaces/map';
import { GameListService } from '@app/services/game-list.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-create-game-page',
    standalone: true,
    imports: [GameListComponent, RouterLink, CharacterCreatorComponent, CommonModule],
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss', '../../../common/css/game-list-page.scss'],
})
export class CreateGamePageComponent implements OnDestroy {
    isCharacterFormVisible: boolean = false;
    selectedGame: Map | null = null;
    private subscription: Subscription = new Subscription();

    constructor(
        private gameListService: GameListService,
        private snackBar: MatSnackBar,
    ) {
        this.subscription.add(
            this.gameListService.selectedGameSubject.subscribe((game: Map | null) => {
                this.selectedGame = game;
            }),
        );
    }

    showCharacterForm() {
        if (!this.selectedGame) {
            this.snackBar.open('Veuillez sélectionner un jeu avant de créer la partie', 'Fermer', {
                duration: 2000,
            });
            return;
        }
        this.gameListService.checkIfVisibleGameExists(this.selectedGame).subscribe((doesGameExist: boolean) => {
            if (doesGameExist) {
                this.isCharacterFormVisible = true;
            } else {
                this.snackBar.open("Le jeu sélectionné n'existe pas ou a été caché", 'Fermer', {
                    duration: 2000,
                });
            }
        });
    }

    hideCharacterForm() {
        this.isCharacterFormVisible = false;
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
