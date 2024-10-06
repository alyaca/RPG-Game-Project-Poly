import { Component, Input } from '@angular/core';
import { PlayerInfo } from '@app/interfaces/playerInfo';
import { GameObjectComponent } from '@app/components/map-editor/game-object/game-object.component';

@Component({
    selector: 'app-player-info-inventory',
    standalone: true,
    imports: [GameObjectComponent, GameObjectComponent],
    templateUrl: './player-info-inventory.component.html',
    styleUrl: './player-info-inventory.component.scss',
})
export class PlayerInfoInventoryComponent {
    @Input() playerInfo: PlayerInfo;
}
