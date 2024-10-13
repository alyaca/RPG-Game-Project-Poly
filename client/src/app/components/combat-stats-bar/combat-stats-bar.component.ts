import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PlayerObjects } from '@app/interfaces/playerObject';

@Component({
    selector: 'app-combat-stats-bar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './combat-stats-bar.component.html',
    styleUrl: './combat-stats-bar.component.scss',
})
export class CombatStatsBarComponent {
    @Input() playerInfo: PlayerObjects;
    @Input() isOnRightSide: boolean;
    @Input() isDamaged: boolean;
}
