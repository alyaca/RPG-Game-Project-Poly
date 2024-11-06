import { Component, Output, EventEmitter } from '@angular/core';
import { GameTileInfoService } from '@app/services/game-tile-info/game-tile-info.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tile-player-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tile-player-info.component.html',
  styleUrl: './tile-player-info.component.scss'
})
export class TilePlayerInfoComponent {
  @Output() closePopup = new EventEmitter<void>();

  constructor(public gameTileInfoService: GameTileInfoService){}

  close() {
    this.closePopup.emit();
  }
}
