import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { LobbyPlayerComponent } from '@app/components/waiting-page/lobby-player/lobby-player.component';
import { MAX_PLAYER_SIZE_INT } from '@app/constants';
import { LobbyPlayer, PlayerSize } from '@app/interfaces/lobbyPlayer';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { GameListService } from '@app/services/game-list.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';
import { Game } from '@common/game';

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

    // sample player lobby (to be generated dynamically later)
    // see app/mocks/mock-lobby-players.ts
    players: LobbyPlayer[] = mockLobbyPlayers;

    constructor(
        private router: Router,
        private playerConnectionService: PlayerConnectionService,
        private gameService: GameService,
        private gameListService: GameListService,
        private dialog: MatDialog,
    ) {
        this.gameListService.chosenGameSubject.subscribe((game: Game | null) => {
            if (game) {
                this.chosenGame = game;
            }
        });
        this.attributeSizeDynamically();
        this.accessCode = this.gameService.roomId;
        this.chosenGame = this.gameService.selectedGame;
    }

    ngOnInit() {
        if (!this.accessCode || !this.chosenGame) {
            this.router.navigate(['/home']);
        }

        this.playerConnectionService.on<string>('roomDeleted', (message: string) => {
            const dialogNavigate = this.dialog.open(SimpleDialogComponent, {
                disableClose: true,
                data: { title: 'Partie annulée', messages: [message] },
            });
            dialogNavigate.afterClosed().subscribe((result) => {
                if (result === 'close') {
                    this.router.navigate(['/home']);
                }
            });
        });
    }

    onLockChange() {
        this.playerConnectionService.send('changeLockRoom', { isLocked: this.isLocked });
    }

    attributeSizeDynamically() {
        const len: number = this.players.length;
        let playerSizeInteger: number = MAX_PLAYER_SIZE_INT;
        const midpoint: number = Math.floor(len / 2);

        for (let i = midpoint; i < len; i++) {
            this.players[i].size = this.getPlayerSize(playerSizeInteger);
            playerSizeInteger--;
        }

        playerSizeInteger = len % 2 === 1 ? MAX_PLAYER_SIZE_INT - 1 : MAX_PLAYER_SIZE_INT;
        for (let i = midpoint - 1; i >= 0; i--) {
            this.players[i].size = this.getPlayerSize(playerSizeInteger);
            playerSizeInteger--;
        }
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

    handleExit(accessCode: string) {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Abandonner la partie?',
                messages: ["- Vous quitteriez la page d'attente"],
                confirm: true,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'leave') {
                this.leaveGame(accessCode);
            }
        });
    }

    leaveGame(accessCode: string) {
        this.playerConnectionService.send('leaveRoom', accessCode);
        this.playerConnectionService.on('leftRoom', (isAdmin) => {
            if (isAdmin) {
                this.router.navigate(['/game-creation']);
            } else {
                this.router.navigate(['/home']);
            }
        });
    }
}
