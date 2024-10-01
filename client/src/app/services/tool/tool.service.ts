import { Injectable } from '@angular/core';
import { ToolButtonService } from '@app/services/tool-button/tool-button.service';

@Injectable({
    providedIn: 'root',
})
export class ToolService {
    tileIds: string[] = ['water-tile', 'ice-tile', 'wall-tile', 'door-tile'];
    selectedTile: string;

    constructor(private toolButtonService: ToolButtonService) {}

    setSelectedTile(tile: string) {
        this.selectedTile = this.selectedTile !== tile ? tile : '';
    }

    getSelectedTile() {
        return this.selectedTile;
    }

    deactivateTileApplicator() {
        this.setSelectedTile('');

        if (this.toolButtonService.selectedButton) {
            this.toolButtonService.selectedButton.toggleActivation();
            this.toolButtonService.selectedButton = null;
        }
    }
}
