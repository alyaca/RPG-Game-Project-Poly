import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';
import { Room } from '@common/room';

@Injectable({
    providedIn: 'root',
})
export class JoinGameService {
    readonly errorMessagesConnection = new Map<string, string>([
        ['invalidFormat', 'Le code doit être composé de 4 chiffres'],
        ['roomNotFound', 'La partie est inexistante'],
        ['roomLocked', 'La partie est verrouillée'],
    ]);

    constructor(
        private socketCommunicationService: SocketCommunicationService,
        private dialog: MatDialog,
        private router: Router,
        private gameService: GameService,
    ) {}

    connect() {
        this.socketCommunicationService.connect();
    }

    getErrorMessage(errorType?: string) {
        if (!errorType) {
            return;
        }
        return this.errorMessagesConnection.get(errorType);
    }

    onJoinGame(roomInfo: Room) {
        this.gameService.setRoomId(roomInfo.roomId);
        this.gameService.selectedGame = roomInfo.gameMap;
    }

    joinLobby(player: Player) {
        this.socketCommunicationService.send('isLocked', this.gameService.roomId);
        this.socketCommunicationService.once('isRoomLocked', (isLocked: boolean) => {
            this.onIsRoomLocked(player, isLocked);
        });
    }

    handleJoinGame(accessCode: string, callback: (roomInfo: Room | null, message: string) => void) {
        this.socketCommunicationService.send('joinRoom', accessCode);
        this.socketCommunicationService.on<Room>('joinedRoom', (roomInfo: Room) => {
            this.onJoinGame(roomInfo);
            callback(roomInfo, '');
        });
        this.socketCommunicationService.on('joinError', (res: string) => {
            const errorMessage = this.getErrorMessage(res) ?? '';
            callback(null, errorMessage);
        });
    }

    onIsRoomLocked(player: Player, isLocked: boolean) {
        if (isLocked) {
            this.handleLockedRoom();
        } else {
            this.socketCommunicationService.send('createPlayer', player);
            this.router.navigate(['/waiting-page'], { queryParams: { roomCode: this.gameService.roomId } });
        }
    }

    handleLockedRoom() {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Partie verrouillée',
                messages: ['Veuillez réessayer plus tard ou retourner au menu principal '],
                options: ['Quitter', 'Rester'],
                confirm: true,
                itemSwap: null
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'left') {
                this.socketCommunicationService.send('leaveRoom', this.gameService.roomId);
                this.router.navigate(['/home']);
            }
        });
    }
}
