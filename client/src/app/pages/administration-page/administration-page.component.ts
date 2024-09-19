import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { PopUpComponent } from '@app/components/popUp/popUp.component';
import { GameAdminstrationService } from '@app/services/game-adminstration.service';

// TODO : Avoir un fichier séparé pour les constantes!

export interface Game {
    src: string;
    name: string;
    size: number;
    description: string;
    mode: string;
    date: string;
    visibility: boolean;
}

@Component({
    selector: 'app-administration-page',
    standalone: true,
    templateUrl: './administration-page.component.html',
    styleUrls: ['./administration-page.component.scss'],
    imports: [CommonModule, RouterLink],
})
export class AdministrationPageComponent {
    game: { src: string; name: string; size: number; description: string; mode: string; date: string } = this.games[0];

    constructor(
        public dialog: MatDialog,
        private gameAdminstrationService: GameAdminstrationService,
    ) {}

    get games(): Game[] {
        return [
            {
                src: '../../../assets/images/tiles/DoorTile-test.jpg',
                name: ' Game 1',
                size: 10,
                description: ' Game description 1',
                mode: ' normal',
                date: '11/09/2024',
                visibility: true,
            },
            {
                src: '../../../assets/images/tiles/GroundTile-test.jpg',
                name: ' Game 2',
                size: 13,
                description: ' Game description 2',
                mode: ' normal',
                date: '11/09/2024',
                visibility: false,
            },
            {
                src: '../../../assets/images/tiles/IceTile-test.jpg',
                name: ' Game 3',
                size: 13,
                description: ' Game description 3',
                mode: ' normal',
                date: '11/09/2024',
                visibility: true,
            },
            {
                src: '../../../assets/images/tiles/WallTile-Test.jpg',
                name: ' Game 4',
                size: 13,
                description: ' Game description 4',
                mode: ' normal',
                date: '11/09/2024',
                visibility: false,
            },
            {
                src: '../../../assets/images/tiles/WaterTile-test.jpg',
                name: ' Game 5',
                size: 13,
                description: ' Game description 5',
                mode: ' normal',
                date: '11/09/2024',
                visibility: true,
            },
        ];
    }

    setHoveredGame(game: { src: string; name: string; size: number; description: string; mode: string; date: string }) {
        this.game = game;
    }

    openPopUp(): void {
        this.dialog.open(PopUpComponent, {
            width: '30%',
            height: '35%',
        });
    }

    gameVisibility(game: { visibility: boolean }) {
        this.gameAdminstrationService.gameVisibility(game);
    }
}
