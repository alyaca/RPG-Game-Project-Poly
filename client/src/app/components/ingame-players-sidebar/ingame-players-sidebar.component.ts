import { Component, Input} from '@angular/core';
import { IngameSidebarPlayer } from '@app/interfaces/ingameSidebarPlayer';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ingame-players-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ingame-players-sidebar.component.html',
  styleUrl: './ingame-players-sidebar.component.scss'
})
export class IngamePlayersSidebarComponent {
  @Input() sidebarPlayer: IngameSidebarPlayer ;
}
