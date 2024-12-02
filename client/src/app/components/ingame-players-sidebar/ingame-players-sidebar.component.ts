import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ObjectType } from '@common/constants';
import { Player } from '@common/interfaces/player';

@Component({
    selector: 'app-ingame-players-sidebar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ingame-players-sidebar.component.html',
    styleUrl: './ingame-players-sidebar.component.scss',
})
export class IngamePlayersSidebarComponent {
    @Input() sidebarPlayer: Player;

    isFlagInInventory() {
        return this.sidebarPlayer.inventory.find((item) => item.id === ObjectType.Flag);
    }
}
