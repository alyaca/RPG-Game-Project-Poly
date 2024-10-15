import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlayerObjects, Status } from '@app/interfaces/playerObject';
@Component({
    selector: 'app-lobby-player',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './lobby-player.component.html',
    styleUrl: './lobby-player.component.scss',
})
export class LobbyPlayerComponent {
    @Input() lobbyPlayer: PlayerObjects;
    isAdmin(){
        return this.lobbyPlayer.status === Status.Admin;
    }

}
