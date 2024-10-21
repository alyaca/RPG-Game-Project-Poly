import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
// import { PlayerObjects } from '@app/interfaces/playerObject';
import { Player } from '@common/player';
@Component({
    selector: 'app-ingame-players-sidebar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ingame-players-sidebar.component.html',
    styleUrl: './ingame-players-sidebar.component.scss',
})
export class IngamePlayersSidebarComponent {
    @Input() sidebarPlayer: Player;
}
