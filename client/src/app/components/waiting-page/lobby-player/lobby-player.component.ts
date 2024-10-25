import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Status } from '@app/interfaces/player-object';
import { Player } from '@common/player';
@Component({
    selector: 'app-lobby-player',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './lobby-player.component.html',
    styleUrl: './lobby-player.component.scss',
})
export class LobbyPlayerComponent {
    @Input() lobbyPlayer: Player;
    @Input() isPlayerAdmin: boolean;
    isAdmin() {
        return this.lobbyPlayer.status === Status.Admin;
    }
}
