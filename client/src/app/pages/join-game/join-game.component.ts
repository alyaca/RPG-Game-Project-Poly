import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CharacterCreatorComponent } from '@app/components/character-creator/character-creator.component';

import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';

@Component({
    selector: 'app-join-game',
    standalone: true,
    imports: [FormsModule, CommonModule, CharacterCreatorComponent, RouterLink],
    templateUrl: './join-game.component.html',
    styleUrl: './join-game.component.scss',
})
export class JoinGameComponent {
    accessCode: string;
    isCharacterFormVisible: boolean = false;
    isJoined: boolean = false;

    constructor(private playerConnectionService: PlayerConnectionService) {
        this.connect();
    }

    get socketId() {
        return this.playerConnectionService.socket.id ? this.playerConnectionService.socket.id : '';
    }

    isCodeValid(accessCode: string): boolean {
        return !isNaN(Number(accessCode)) && this.isJoined;
    }

    joinGame(accessCode: string) {
        this.playerConnectionService.send('joinRoom', accessCode);
        this.playerConnectionService.on<string>('joinedRoom', (roomCode) => {
            this.isJoined = true;
            this.isCharacterFormVisible = true;
            console.log('Joined room:', roomCode);
        });
    }

    hideCharacterForm() {
        this.isCharacterFormVisible = false;
    }

    connect() {
        if (!this.playerConnectionService.isSocketAlive()) {
            this.playerConnectionService.connect();
            this.playerConnectionService.on('connect', () => {
                console.log(`Connexion par WebSocket sur le socket ${this.socketId}`);
            });
        }
    }
}
