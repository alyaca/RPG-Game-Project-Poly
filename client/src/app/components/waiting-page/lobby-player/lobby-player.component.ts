import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
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
}
