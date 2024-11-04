import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CharacterCreatorComponent } from '@app/components/character-creator/character-creator.component';
import { JoinGameService } from '@app/services/sockets/join-game/join-game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Avatar, Player } from '@common/player';
import { Room } from '@common/room';
@Component({
    selector: 'app-join-game',
    standalone: true,
    imports: [FormsModule, CharacterCreatorComponent, RouterLink],
    templateUrl: './join-game.component.html',
    styleUrl: './join-game.component.scss',
})
export class JoinGameComponent implements OnDestroy {
    accessCode: string;
    isCharacterFormVisible: boolean = false;
    errorMessage: string = '';
    submitForm: boolean = false;
    availableAvatars: Avatar[] = [];

    constructor(
        private socketCommunicationService: SocketCommunicationService,
        private joinGameService: JoinGameService,
    ) {
        this.joinGameService.connect();
        this.socketCommunicationService.on('characterSelected', (availableAvatars: Avatar[]) => {
            this.availableAvatars = availableAvatars;
        });
    }

    ngOnDestroy() {
        this.socketCommunicationService.off('characterSelected');
    }

    joinGame(accessCode: string) {
        this.submitForm = true;
        this.errorMessage = '';
        this.joinGameService.handleJoinGame(accessCode, (roomInfo: Room | null, message: string) => {
            if (roomInfo) {
                this.isCharacterFormVisible = true;
                this.availableAvatars = roomInfo.availableAvatars;
            } else {
                this.errorMessage = message;
            }
        });
    }

    joinLobby(player: Player) {
        this.joinGameService.joinLobby(player);
    }

    selectedAvatar(avatar: Avatar) {
        this.socketCommunicationService.send('selectCharacter', avatar);
    }

    leaveGame(roomCode: string) {
        this.isCharacterFormVisible = false;
        this.socketCommunicationService.send('leaveRoom', roomCode);
        this.accessCode = '';
    }
}
