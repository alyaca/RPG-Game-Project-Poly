import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CharacterCreatorComponent } from '@app/components/character-creator/character-creator.component';
import { GameService } from '@app/services/sockets/game/game.service';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';
import { Room } from '@common/room';

@Component({
    selector: 'app-join-game',
    standalone: true,
    imports: [FormsModule, CommonModule, CharacterCreatorComponent, RouterLink],
    templateUrl: './join-game.component.html',
    styleUrl: './join-game.component.scss',
})
export class JoinGameComponent {
    readonly errorMessages = {
        invalidCode: 'Le code doit être composé de 4 chiffres',
        roomNotFound: 'La partie est inexistante',
    };
    accessCode: string;
    isCharacterFormVisible: boolean = false;
    isJoined: boolean = false;
    errorMessage: string = '';
    submitForm: boolean = false;

    constructor(
        private playerConnectionService: PlayerConnectionService,
        private router: Router,
        private gameService: GameService,
    ) {
        this.connect();
    }

    isValidCode(accessCode: string): boolean {
        return /^[0-9]{4}$/.test(accessCode);
    }

    joinGame(accessCode: string) {
        this.submitForm = true;
        this.errorMessage = '';
        if (!this.isValidCode(accessCode)) {
            this.errorMessage = this.errorMessages.invalidCode;
            return;
        }

        this.playerConnectionService.send('joinRoom', accessCode);
        this.playerConnectionService.on<Room>('joinedRoom', (roomInfo: Room) => {
            this.onJoinGame(roomInfo);
        });

        this.playerConnectionService.on('joinError', () => {
            this.errorMessage = this.errorMessages.roomNotFound;
        });
    }

    onJoinGame(roomInfo: Room) {
        this.isJoined = true;
        this.isCharacterFormVisible = true;
        this.gameService.setRoomId(roomInfo.roomId);
        this.gameService.selectedGame = roomInfo.gameMap;
    }

    joinLobby(accessCode: string) {
        this.router.navigate(['/waiting-page'], { queryParams: { roomCode: accessCode } });
    }

    leaveGame(roomCode: string) {
        this.isCharacterFormVisible = false;
        this.playerConnectionService.send('leaveRoom', roomCode);
        this.router.navigate(['/home']);
    }

    connect() {
        if (!this.playerConnectionService.isSocketAlive()) {
            this.playerConnectionService.connect();
        }
    }
}
