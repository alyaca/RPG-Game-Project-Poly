import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ACCESS_CODE_LENGTH, MAX_ACCESS_CODE_VALUE, MAX_PLAYER_SIZE_INT } from '@app/constants';
import { Map } from '@app/interfaces/map';
import { GameListService } from '@app/services/game-list.service';
import { LobbyPlayerComponent } from '@app/components/waiting-page/lobby-player/lobby-player.component';
import { LobbyPlayer, PlayerSize } from '@app/interfaces/lobbyPlayer';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';

@Component({
    selector: 'app-waiting-page',
    standalone: true,
    imports: [RouterLink, CommonModule, LobbyPlayerComponent, ChatBoxComponent],
    templateUrl: './waiting-page.component.html',
    styleUrl: './waiting-page.component.scss',
})
export class WaitingPageComponent implements OnInit {
    accessCode: string = '';
    maxRandom = MAX_ACCESS_CODE_VALUE;
    chosenGame: Map;

    // sample player lobby (to be generated dynamically later)
    // see app/mocks/mock-lobby-players.ts to see
    players: LobbyPlayer[] = mockLobbyPlayers;

    private readonly accesCodeLength = ACCESS_CODE_LENGTH;

    constructor(
        private gameListService: GameListService,
        private router: Router,
        private dialog: MatDialog,
    ) {
        this.gameListService.chosenGameSubject.subscribe((game: Map | null) => {
            if (game) {
                this.chosenGame = game;
            }
        });
        this.attributeSizeDynamically();
    }

    ngOnInit() {
        this.accessCode = this.generateAccesCode();
        if (!this.gameListService.chosenGameSubject.getValue()) {
            this.router.navigate(['/game-creation']);
        }
    }

    generateAccesCode(): string {
        const code = Math.floor(Math.random() * this.maxRandom);
        return code.toString().padStart(this.accesCodeLength, '0');
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

    handleExit() {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Abandonner la partie?',
                messages: ['- vous quitteriez le lobby de jeu'],
                confirm: true,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'leave') {
                this.router.navigate(['/home']);
            }
        });
    }
}
