import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { GameTileInfoService } from '@app/services/game-tile-info/game-tile-info.service';

@Component({
    selector: 'app-tile-player-info',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './tile-player-info.component.html',
    styleUrl: './tile-player-info.component.scss',
})
export class TilePlayerInfoComponent {
    @Output() closePopup = new EventEmitter<void>();

    constructor(public gameTileInfoService: GameTileInfoService) {}

    close() {
        this.closePopup.emit();
    }
}
