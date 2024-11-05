import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-tile-player-info',
  standalone: true,
  imports: [],
  templateUrl: './tile-player-info.component.html',
  styleUrl: './tile-player-info.component.scss'
})
export class TilePlayerInfoComponent {
  @Input() positionX: number = 0;
  @Input() positionY: number = 0;
  @Output() closePopup = new EventEmitter<void>();
  close() {
    this.closePopup.emit();
  }
}
