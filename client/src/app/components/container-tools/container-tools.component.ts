import { Component } from '@angular/core';
import { ToolButtonComponent } from '../tool-button/tool-button.component';
import { ToolService } from '@app/services/tool.service';

@Component({
    selector: 'app-container-tools',
    standalone: true,
    imports: [ToolButtonComponent],
    templateUrl: './container-tools.component.html',
    styleUrl: './container-tools.component.scss',
})
export class ContainerToolsComponent {
    constructor(public toolService: ToolService) { }
    tileIds: string[] = this.toolService.tileIds;
    tileNames: string[] = ["Tuile d'eau", 'Tuile de glace', 'Tuile de mur', 'Tuile de porte'];

    onSelectTile(tile: string) {
      this.toolService.setSelectedTile(tile);
    }
}
