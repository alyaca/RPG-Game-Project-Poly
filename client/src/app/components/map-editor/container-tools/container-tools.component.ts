import { Component } from '@angular/core';
import { ToolButtonComponent } from '@app/components/map-editor/tool-button/tool-button.component';
import { ToolService } from '@app/services/tool/tool.service';

@Component({
    selector: 'app-container-tools',
    standalone: true,
    imports: [ToolButtonComponent],
    templateUrl: './container-tools.component.html',
    styleUrl: './container-tools.component.scss',
})
export class ContainerToolsComponent {
    tileIds: string[] = this.toolService.tileIds;
    tileNames: string[] = ['Eau', 'Glace', 'Mur', 'Porte'];
    constructor(public toolService: ToolService) {}
    onSelectTile(tile: string) {
        this.toolService.setSelectedTile(tile);
    }
}
