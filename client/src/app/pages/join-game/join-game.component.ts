import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { CharacterCreatorComponent } from '@app/components/character-creator/character-creator.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { GameService } from '@app/services/sockets/game/game.service';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';
import { Avatar, Player } from '@common/player';
import { Room } from '@common/room';
@Component({
    selector: 'app-join-game',
    standalone: true,
    imports: [FormsModule, CommonModule, CharacterCreatorComponent, RouterLink],
    templateUrl: './join-game.component.html',
    styleUrl: './join-game.component.scss',
})
export class JoinGameComponent {
    readonly errorMessagesConnection = new Map<string, string>([
        ['invalidCode', 'Le code doit être composé de 4 chiffres'],
        ['roomNotFound', 'La partie est inexistante'],
        ['roomLocked', 'La partie est verrouillée'],
    ]);
    accessCode: string;
    isCharacterFormVisible: boolean = false;
    isJoined: boolean = false;
    errorMessage: string = '';
    submitForm: boolean = false;
    availableAvatars: Avatar[] = [];

    constructor(
        private playerConnectionService: PlayerConnectionService,
        private router: Router,
        private gameService: GameService,
        private dialog: MatDialog,
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
            this.setErrorMessage('invalidCode');
            return;
        }

        this.playerConnectionService.send('joinRoom', accessCode);
        this.playerConnectionService.on<Room>('joinedRoom', (roomInfo: Room) => {
            this.onJoinGame(roomInfo);
        });
        this.playerConnectionService.on('joinError', (res: string) => {
            this.setErrorMessage(res);
        });
    }

    setErrorMessage(errorType?: string) {
        if (!errorType) {
            return;
        }
        const message = this.errorMessagesConnection.get(errorType);
        if (message) this.errorMessage = message;
    }

    onJoinGame(roomInfo: Room) {
        this.isJoined = true;
        this.isCharacterFormVisible = true;
        this.gameService.setRoomId(roomInfo.roomId);
        this.gameService.selectedGame = roomInfo.gameMap;
        console.log('room info', roomInfo.availableAvatars);
        this.availableAvatars = roomInfo.availableAvatars;
    }

    joinLobby(player: Player) {
        this.playerConnectionService.send('isLocked', this.gameService.roomId);

        this.playerConnectionService.once('isRoomLocked', (isLocked) => {
            if (isLocked) {
                this.handleLockedRoom();
            } else {
                this.playerConnectionService.send('createPlayer', player);
                this.router.navigate(['/waiting-page'], { queryParams: { roomCode: this.gameService.roomId } });
            }
        });
    }

    selectedAvatar(avatar: Avatar) {
        console.log(avatar);
        this.playerConnectionService.send('selectCharacter', avatar);
    }

    handleLockedRoom() {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Partie verrouillée',
                messages: ['Veuillez réessayer plus tard ou retourner au menu principal '],
                confirm: true,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'leave') {
                this.playerConnectionService.send('leaveRoom', this.gameService.roomId);
                this.router.navigate(['/home']);
            }
        });
    }

    leaveGame(roomCode: string) {
        this.isCharacterFormVisible = false;
        this.playerConnectionService.send('leaveRoom', roomCode);
        this.playerConnectionService.on('leftRoom', (isAdmin) => {
            if (!isAdmin) this.router.navigate(['/join-page']);
        });
    }

    connect() {
        if (!this.playerConnectionService.isSocketAlive()) {
            this.playerConnectionService.connect();
        }
    }
}
