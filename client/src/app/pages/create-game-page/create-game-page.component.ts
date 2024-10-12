import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { CharacterCreatorComponent } from '@app/components/character-creator/character-creator.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { MESSAGE_DURATION_CHARACTER_FORM } from '@app/constants';
import { Map } from '@app/interfaces/map';
import { GameListService } from '@app/services/game-list.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-create-game-page',
    standalone: true,
    imports: [GameListComponent, RouterLink, CharacterCreatorComponent, CommonModule],
    templateUrl: './create-game-page.component.html',
    styleUrl: '../../../common/css/game-list-page.scss',
})
export class CreateGamePageComponent implements OnDestroy {
    isCharacterFormVisible: boolean = false;
    selectedGame: Map | null = null;
    private subscription: Subscription = new Subscription();
    roomCode: string | null;

    constructor(
        private gameListService: GameListService,
        private snackBar: MatSnackBar,
        private playerConnectionService: PlayerConnectionService,
        private gameService: GameService,
        private router: Router,
    ) {
        this.subscription.add(
            this.gameListService.selectedGameSubject.subscribe((game: Map | null) => {
                this.selectedGame = game;
            }),
        );
        this.connect();
    }

    showCharacterForm() {
        if (!this.selectedGame) {
            this.snackBar.open('Veuillez sélectionner un jeu avant de créer la partie', 'Fermer', {
                duration: MESSAGE_DURATION_CHARACTER_FORM,
            });
            return;
        }
        this.gameListService.checkIfVisibleGameExists(this.selectedGame).subscribe((game: Map | null) => {
            if (game) {
                this.isCharacterFormVisible = true;
                this.gameListService.chosenGameSubject.next(game);
            } else {
                this.snackBar.open("Le jeu sélectionné n'existe pas ou a été caché", 'Fermer', {
                    duration: MESSAGE_DURATION_CHARACTER_FORM,
                });
            }
        });
    }

    joinLobby() {
        this.createRoom();

        // send character selection
    }

    hideCharacterForm() {
        this.isCharacterFormVisible = false;
    }

    connect() {
        this.playerConnectionService.connect();
        this.playerConnectionService.on<string>('connect', () => {
            console.log('Connexion par WebSocket sur le socket:', this.socketId);
        });
    }

    get socketId() {
        return this.playerConnectionService.socket.id ? this.playerConnectionService.socket.id : '';
    }

    createRoom() {
        this.playerConnectionService.send('createRoom');
        this.playerConnectionService.on<string>('roomCreated', (roomCode) => {
            this.roomCode = roomCode;
            this.gameService.setRoomId(roomCode);
            this.gameService.joinRoom(this.roomCode);
            this.router.navigate(['/waiting-page']);
        });
    }

    ngOnDestroy() {
        this.gameListService.selectedGameSubject.next(null);
        this.subscription.unsubscribe();
    }
}
