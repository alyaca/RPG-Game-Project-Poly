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
    fakeCode: string = '1111';
    submit: boolean;
    isCharacterFormVisible: boolean = false;
    roomMessage = '';

    constructor(private playerConnection: PlayerConnectionService) {}

    get socketId() {
        return this.playerConnection.socket.id ? this.playerConnection.socket.id : '';
    }

    isCodeValid(accessCode: string): boolean {
        return !isNaN(Number(accessCode));
    }

    roomExists(accessCode: string): boolean {
        return accessCode == this.fakeCode;
    }

    //revoir tout ca
    joinGame(accessCode: string) {
        this.submit = true;
        if (this.isCodeValid(accessCode)) {
            if (this.roomExists(accessCode)) {
                this.isCharacterFormVisible = true;
                this.connect();
                //this.gameListervice.getGameId(this.accessCode); //mhhhh
            }
        }
    }

    hideCharacterForm() {
        this.isCharacterFormVisible = false;
    }

    connect() {
        if (!this.playerConnection.isSocketAlive()) {
            this.playerConnection.connect();
        }
    }

    joinRoom() {
        this.playerConnection.send('joinRoom');
    }

    sendToRoom() {
        this.playerConnection.send('roomMessage', this.roomMessage);
        this.roomMessage = '';
    }
}
