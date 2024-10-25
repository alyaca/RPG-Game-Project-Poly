import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { LobbyPlayerComponent } from '@app/components/waiting-page/lobby-player/lobby-player.component';
import { GameListService } from '@app/services/game-list.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Game } from '@common/game';
import { Player } from '@common/player';
import { Room } from '@common/room';

@Component({
    selector: 'app-waiting-page',
    standalone: true,
    imports: [RouterLink, CommonModule, LobbyPlayerComponent, ChatBoxComponent, FormsModule],
    templateUrl: './waiting-page.component.html',
    styleUrl: './waiting-page.component.scss',
})
export class WaitingPageComponent implements OnInit {
    accessCode: string;
    chosenGame: Game;
    isLocked: boolean = false;
    players: Player[];

    constructor(
        private router: Router,
        private socketCommunicationService: SocketCommunicationService,
        private gameService: GameService,
        private gameListService: GameListService,
        private dialog: MatDialog,
    ) {
        this.gameListService.chosenGameSubject.subscribe((game: Game | null) => {
            if (game) {
                this.chosenGame = game;
            }
        });
        this.accessCode = this.gameService.roomId;
        this.chosenGame = this.gameService.selectedGame;
    }

    ngOnInit() {
        if (!this.accessCode || !this.chosenGame) {
            this.router.navigate(['/home']);
        }
        if (!this.accessCode || !this.chosenGame) {
            this.router.navigate(['/home']);
        }

        this.socketCommunicationService.on<string>('roomDeleted', (message: string) => {
            this.onAdminQuit(message);
        });

        this.socketCommunicationService.on('updatedPlayer', (room: Room) => {
            this.players = room.listPlayers;
        });
    }

    onAdminQuit(message: string) {
        const dialogNavigate = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: { title: 'Partie annulée', messages: [message] },
        });
        dialogNavigate.afterClosed().subscribe((result) => {
            if (result === 'close') {
                this.router.navigate(['/home']);
            }
        });
    }

    onLockChange() {
        this.gameService.isRoomLocked = this.isLocked;
        this.socketCommunicationService.send('changeLockRoom', { isLocked: this.isLocked });
    }

    getPlayerSize(val: number): PlayerSize {
        if (val >= MAX_PLAYER_SIZE_INT) {
            return PlayerSize.Big;
        } else if (val === 1) {
            return PlayerSize.Medium;
        } else {
            return PlayerSize.Small;
        }
    }

    handleStartGame() {
        this.socketCommunicationService.send('startGame');
    }

    handleExit(accessCode: string) {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title,
                messages,
                options,
                confirm,
            },
        });
        return dialogRef.afterClosed();
    }

    handleExit(accessCode: string) {
        this.openConfirmationDialog('Abandonner la partie?', ["- Vous quitteriez la page d'attente"], ['Quitter', 'Rester'], true).subscribe(
            (result) => {
                if (result === 'left') {
                    this.leaveGame(accessCode);
                }
            },
        );
    }

    handleStartGame() {
        this.openConfirmationDialog(
            'Débuter la partie',
            ['- Êtes-vous certains de vouloir débuter la partie?'],
            ['Annuler', 'Confirmer'],
            true,
        ).subscribe((result) => {
            if (result === 'right') {
                this.router.navigate(['/game-page']);
            }
        });
    }

    leaveGame(accessCode: string) {
        this.socketCommunicationService.send('leaveRoom', accessCode);
        this.socketCommunicationService.on('leftRoom', (isAdmin) => {
            if (isAdmin) {
                this.router.navigate(['/game-creation']);
            } else {
                this.router.navigate(['/home']);
            }
        });
    }
}
