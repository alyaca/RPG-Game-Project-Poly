import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { LobbyPlayerComponent } from '@app/components/waiting-page/lobby-player/lobby-player.component';
import { ACCESS_CODE_LENGTH, MAX_ACCESS_CODE_VALUE, MAX_PLAYER_SIZE_INT, PLAYERS } from '@app/constants';
import { Map } from '@app/interfaces/map';
import { GameListService } from '@app/services/game-list.service';
import { PlayerObjects, LobbySize, Status} from '@app/interfaces/playerObject';

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
    // see app/mocks/mock-lobby-players.ts
    players: PlayerObjects[] = PLAYERS;

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
        this.ensureAdminIsFirst(); // may be uneeded in the future
        this.attributeSizeDynamically();
    }


    ensureAdminIsFirst() {
        this.players = [
            ...this.players.filter(player => player.status === Status.Admin),  
            ...this.players.filter(player => player.status !== Status.Admin)    
        ];
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
            this.players[i].size = this.getLobbySize(playerSizeInteger);
            playerSizeInteger--;
        }

        playerSizeInteger = len % 2 === 1 ? MAX_PLAYER_SIZE_INT - 1 : MAX_PLAYER_SIZE_INT;
        for (let i = midpoint - 1; i >= 0; i--) {
            this.players[i].size = this.getLobbySize(playerSizeInteger);
            playerSizeInteger--;
        }
    }

    getLobbySize(val: number): LobbySize {
        if (val >= MAX_PLAYER_SIZE_INT) {
            return LobbySize.Big;
        } else if (val === 1) {
            return LobbySize.Medium;
        } else {
            return LobbySize.Small;
        }
    }

    openConfirmationDialog(title: string, messages: string[], options: string[], confirm: boolean) {
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

    handleExit() {
        this.openConfirmationDialog('Abandonner la partie?', ["- Vous quitteriez la page d'attente"], ['Quitter', 'Rester'], true).subscribe(
            (result) => {
                if (result === 'left') {
                    this.router.navigate(['/home']);
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
}
