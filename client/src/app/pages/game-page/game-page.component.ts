import { Component, Input } from '@angular/core';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';

@Component({
  selector: 'app-game-page',
  standalone: true,
  imports: [GameGridComponent],
  templateUrl: './game-page.component.html',
  styleUrl: './game-page.component.scss'
})
export class GamePageComponent {
  @Input() selectedSize: string | null = "small";
  mapName: string = 'Exemple';
  mapDescription: string = 'Ma tres courte description';
  resetTrigger: boolean = false;
  saveTrigger: boolean = false;

  
}
