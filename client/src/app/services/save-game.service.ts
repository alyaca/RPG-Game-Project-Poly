// import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EditionGameGridComponent } from '@app/components/edition-game-grid/edition-game-grid.component';
import { Game } from '@app/interfaces/game';
// import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class SaveGameService {
    // private apiURL = `${environment.serverUrl}/maps`;

    constructor() {}

    saveGame(image: string, mapName: string, mapDescription: string, selectedMap: Game | null, gridComponent: EditionGameGridComponent) {
        console.log(gridComponent.gridArray);
        //     if (selectedMap == null) {
        //         let playerNumber = 2;
        //         switch (height) {
        //             case 10: {
        //                 playerNumber = 2;
        //                 break;
        //             }
        //             case 15: {
        //                 playerNumber = 4;
        //                 break;
        //             }
        //             case 20: {
        //                 playerNumber = 6;
        //                 break;
        //             }
        //         }
        //         const mapToStore = {
        //             name: mapName,
        //             description: mapDescription,
        //             visible: true,
        //             mode: 'normal', //will have to get it from admin
        //             nbPlayers: playerNumber,
        //             image: image,
        //             tiles: grid,
        //             dimension: height, // will have to get it from admin, consequently, the nb of players will also change.
        //             itemPlacement: items,
        //             isSelected: false,
        //             lastModification: new Date(),
        //         };
        //         return this.http.post(this.apiURL, mapToStore);
        //     } else {
        //         const mapToReplace = {
        //             name: mapName,
        //             description: mapDescription,
        //             visible: selectedMap.visible,
        //             mode: selectedMap.mode,
        //             nbPlayers: selectedMap.nbPlayers,
        //             image: image,
        //             tiles: grid,
        //             dimension: selectedMap.dimension,
        //             itemPlacement: items,
        //             isSelected: false,
        //             lastModification: new Date(),
        //         };
        //         return this.http.post(this.apiURL, mapToReplace);
        //     }
    }
}

// replaceGame(gameId: string, mapToReplace: any) {
//     const newMapObject: Map = {
//         _id: gameId,
//         name: mapToReplace.name,
//         description: mapToReplace.description,
//         visible: mapToReplace.visible,
//         mode: mapToReplace.mode,
//         nbPlayers: mapToReplace.nbPlayers,
//         image: mapToReplace.image,
//         dimension: mapToReplace.dimension,
//         tiles: mapToReplace.tiles,
//         itemPlacement: mapToReplace.itemPlacement,
//         isSelected: mapToReplace.isSelected,
//         lastModification: mapToReplace.lastModification,
//     };
//     return this.http.put(this.apiURL, newMapObject);
// }
