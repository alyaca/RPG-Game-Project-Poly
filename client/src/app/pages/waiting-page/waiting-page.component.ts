import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Map } from '@app/interfaces/map';
import { GameListService } from '@app/services/game-list.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';

@Component({
    selector: 'app-waiting-page',
    standalone: true,
    imports: [RouterLink, CommonModule, FormsModule],
    templateUrl: './waiting-page.component.html',
    styleUrl: './waiting-page.component.scss',
})
export class WaitingPageComponent implements OnInit {
    accessCode: string;
    chosenGame: Map;

    constructor(
        private gameListService: GameListService,
        private router: Router,
        private playerConnectionService: PlayerConnectionService,
        private gameService: GameService,
    ) {
        this.gameListService.chosenGameSubject.subscribe((game: Map | null) => {
            if (game) {
                this.chosenGame = game;
            }
        });
    }

    ngOnInit() {
        if (!this.gameListService.chosenGameSubject.getValue()) {
            this.router.navigate(['/game-creation']);
        }
        this.accessCode = this.gameService.roomId;
        this.joinRoom(this.accessCode);
    }

    get socketId() {
        return this.playerConnectionService.socket.id ? this.playerConnectionService.socket.id : '';
    }

    connect() {
        if (!this.playerConnectionService.isSocketAlive()) {
            this.playerConnectionService.connect();
            this.playerConnectionService.on('connect', () => {
                console.log(`Connexion par WebSocket sur le socket ${this.socketId}`);
            });
        }
    }

    joinRoom(roomCode: string) {
        this.playerConnectionService.send('joinRoom', roomCode);
        this.playerConnectionService.on<string>('joinedRoom', (roomCode) => {
            console.log('Joined room:', roomCode);
        });
    }
}
