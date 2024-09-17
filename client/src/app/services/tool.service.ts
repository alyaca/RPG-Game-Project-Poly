import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToolService {
    tileIds: string[] = ['water-tile', 'ice-tile', 'wall-tile', 'door-tile'];
    selectedTile: string;
  
    constructor() { }
  
    setSelectedTile(tile: string) {
      this.selectedTile = tile;
    }
  
    getSelectedTile() {
      return this.selectedTile;
    }
}

// DO NOT FORGET TO MAKE TEST FILE FOR THIS SERVICE!!!