import { Component } from '@angular/core';
import { ToolButtonComponent } from '@app/components/map-editor/tool-button/tool-button.component';
import { TileButtonName, TileId } from '@app/constants';
import { ToolService } from '@app/services/tool/tool.service';

@Component({
    selector: 'app-container-tools',
    standalone: true,
    imports: [ToolButtonComponent],
    templateUrl: './container-tools.component.html',
    styleUrl: './container-tools.component.scss',
})
export class ContainerToolsComponent {
    tileIds = TileId;
    tileNames = TileButtonName;

    constructor(private toolService: ToolService) {}

    onSelectTile(tile: TileId) {
        this.toolService.setSelectedTile(tile);
    }
}
