import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { CharacterCreatorComponent } from '@app/components/character-creator/character-creator.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { MESSAGE_DURATION_CHARACTER_FORM } from '@app/constants';
import { GameListService } from '@app/services/game-list.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { avatars } from '@common/avatarsInfo';
import { Game } from '@common/game';
import { Player } from '@common/player';
import { Room } from '@common/room';
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
    selectedGame: Game | null = null;
    roomCode: string;
    gameName: string;
    availableAvatars = avatars;

    private subscription: Subscription = new Subscription();

    constructor(
        private gameListService: GameListService,
        private snackBar: MatSnackBar,
        private socketCommunicationService: SocketCommunicationService,
        private gameService: GameService,
        private router: Router,
    ) {
        this.subscription.add(
            this.gameListService.selectedGameSubject.subscribe((game: Game | null) => {
                this.selectedGame = game;
            }),
        );
        if (!this.socketCommunicationService.isSocketAlive()) {
            this.socketCommunicationService.connect();
        }
    }

    showCharacterForm() {
        if (!this.selectedGame) {
            this.snackBar.open('Veuillez sélectionner un jeu avant de créer la partie', 'Fermer', {
                duration: MESSAGE_DURATION_CHARACTER_FORM,
            });
            return;
        }
        this.gameListService.checkIfVisibleGameExists(this.selectedGame).subscribe((game: Game | null) => {
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

    joinLobby(player: Player) {
        this.createRoom();
        this.socketCommunicationService.send('createPlayer', player);
    }

    hideCharacterForm() {
        this.isCharacterFormVisible = false;
    }

    createRoom() {
        console.log('CREATE ROOM');
        this.socketCommunicationService.send('createRoom', this.selectedGame);
        this.socketCommunicationService.on('roomCreated', (roomInfo: Room) => {
            console.log('ROOM CREATED');
            this.gameService.selectedGame = roomInfo.gameMap;
            this.roomCode = roomInfo.roomId;
            this.gameService.setRoomId(this.roomCode);
            this.gameService.joinRoom(this.roomCode);
            this.router.navigate(['/waiting-page'], { queryParams: { roomCode: this.roomCode } });
        });
    }

    ngOnDestroy() {
        this.gameListService.selectedGameSubject.next(null);
        this.subscription.unsubscribe();
    }
}
