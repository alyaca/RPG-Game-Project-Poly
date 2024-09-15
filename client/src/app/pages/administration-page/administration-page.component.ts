import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { PopUpComponent } from '../../components/popUp/popUp.component';

// TODO : Avoir un fichier séparé pour les constantes!

export interface Game {
    src: string;
    name: string;
    size: number;
    description: string;
    mode: string;
    date: string;
}

@Component({
    selector: 'app-administration-page',
    standalone: true,
    templateUrl: './administration-page.component.html',
    styleUrls: ['./administration-page.component.scss'],
    imports: [CommonModule, RouterLink],
})
export class AdministrationPageComponent {
    get games(): Game[] {
        return [
            {
                src: '../../../assets/image/image1.webp',
                name: ' Game 1',
                size: 10,
                description: ' Game description 1',
                mode: ' normal',
                date: '11/09/2024',
            },
            {
                src: '../../../assets/image/image2.webp',
                name: ' Game 2',
                size: 13,
                description: ' Game description 2',
                mode: ' normal',
                date: '11/09/2024',
            },
            {
                src: '../../../assets/image/image3.webp',
                name: ' Game 3',
                size: 13,
                description: ' Game description 3',
                mode: ' normal',
                date: '11/09/2024',
            },
            {
                src: '../../../assets/image/image4.webp',
                name: ' Game 4',
                size: 13,
                description: ' Game description 4',
                mode: ' normal',
                date: '11/09/2024',
            },
            {
                src: '../../../assets/image/image4.webp',
                name: ' Game 5',
                size: 13,
                description: ' Game description 5',
                mode: ' normal',
                date: '11/09/2024',
            },
        ];
    }

    HoverGame: { src: string; name: string; size: number; description: string; mode: string; date: string } = this.games[0];

    getHoveredGame(game: { src: string; name: string; size: number; description: string; mode: string; date: string }) {
        this.HoverGame = game;
    }

    constructor(public dialog: MatDialog) {}

    openPopUp(): void {
        this.dialog.open(PopUpComponent, {
            width: '25%',
            height: '30%',
            data: {
                firstQuestion: 'Choisir un mode de jeu:',
                secondQuestion: 'Choisir la taille du jeu:',
                gameMode: ['Classique', 'CTF'],
                gameSize: ['10x10', '15x15', '20x20'],
                option: ['Annuler', 'Création'],
            },
        });
    }
}
