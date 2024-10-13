import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GameListService } from '@app/services/game-list.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';
import { Game } from '@common/game';

@Component({
    selector: 'app-waiting-page',
    standalone: true,
    imports: [RouterLink, CommonModule, FormsModule],
    templateUrl: './waiting-page.component.html',
    styleUrl: './waiting-page.component.scss',
})
export class WaitingPageComponent implements OnInit {
    accessCode: string;
    chosenGame: Game;

    constructor(
        private router: Router,
        private playerConnectionService: PlayerConnectionService,
        private gameService: GameService,
        private gameListService: GameListService,
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
            this.router.navigate(['/game-creation']);
        }

        this.playerConnectionService.on<string>('roomDeleted', (message: string) => {
            alert(message); // change for the error dialog
            this.router.navigate(['/home']);
        });
    }

    leaveGame(roomCode: string) {
        this.playerConnectionService.send('leaveRoom', roomCode);
        this.router.navigate(['/create-game']);
    }
}
