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
    get games(): Game[] {
        return [
            {
                src: '../../../assets/image/image1.webp',
                name: ' Game 1',
                size: 10,
                description: ' Game description 1',
                mode: ' normal',
                date: '11/09/2024',
                visibility: true,
            },
            {
                src: '../../../assets/image/image2.webp',
                name: ' Game 2',
                size: 13,
                description: ' Game description 2',
                mode: ' normal',
                date: '11/09/2024',
                visibility: false,
            },
            {
                src: '../../../assets/image/image3.webp',
                name: ' Game 3',
                size: 13,
                description: ' Game description 3',
                mode: ' normal',
                date: '11/09/2024',
                visibility: true,
            },
            {
                src: '../../../assets/image/image4.webp',
                name: ' Game 4',
                size: 13,
                description: ' Game description 4',
                mode: ' normal',
                date: '11/09/2024',
                visibility: false,
            },
            {
                src: '../../../assets/image/image4.webp',
                name: ' Game 5',
                size: 13,
                description: ' Game description 5',
                mode: ' normal',
                date: '11/09/2024',
                visibility: true,
            },
        ];
    }

    Game: { src: string; name: string; size: number; description: string; mode: string; date: string; visibility: boolean } = this.games[0];

    getHoveredGame(game: { src: string; name: string; size: number; description: string; mode: string; date: string; visibility: boolean }) {
        this.Game = game;
    }

    enableButton() {
        const editButton = document.getElementById('editButton') as HTMLButtonElement;
        editButton.disabled = false;
        const deleteButton = document.getElementById('deleteButton') as HTMLButtonElement;
        deleteButton.disabled = false;
        console.log('ca rentre dans la fonction');
    }

    selectedElement: HTMLElement | null = null;

    selectedGame(event: Event): void {
        if (this.selectedElement) {
            this.selectedElement.classList.remove('selected');
        }

        const target = (event.target as HTMLElement).closest('.game');
        if (target) {
            this.selectedElement = target as HTMLElement;
            this.selectedElement.classList.add('selected');
            this.enableButton();
        }
    }

    constructor(public dialog: MatDialog) {}

    openPopUp(): void {
        this.dialog.open(PopUpComponent, {
            width: '30%',
            height: '35%',
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
