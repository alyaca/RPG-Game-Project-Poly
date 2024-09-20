import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ToolService {
    tileIds: string[] = ['water-tile', 'ice-tile', 'wall-tile', 'door-tile'];
    selectedTile: string;

    setSelectedTile(tile: string) {
        this.selectedTile = this.selectedTile !== tile ? tile : '';
    }

    getSelectedTile() {
        return this.selectedTile;
    }
}
