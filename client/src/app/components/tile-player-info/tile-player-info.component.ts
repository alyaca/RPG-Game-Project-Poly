import { Component, Output, EventEmitter } from '@angular/core';
import { GameTileInfoService } from '@app/services/game-tile-info.service';
// import { GameObject } from '@common/game-object';
@Component({
  selector: 'app-tile-player-info',
  standalone: true,
  imports: [],
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
