import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LobbyPlayer } from '@app/interfaces/lobbyPlayer';

@Component({
    selector: 'app-lobby-player',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './lobby-player.component.html',
    styleUrl: './lobby-player.component.scss',
})
export class LobbyPlayerComponent {
    @Input() lobbyPlayer: LobbyPlayer;
}
