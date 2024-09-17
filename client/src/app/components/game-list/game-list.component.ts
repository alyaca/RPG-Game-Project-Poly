import { CommonModule, NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { Game } from '@app/interfaces/game';

@Component({
    selector: 'app-game-list',
    standalone: true,
    imports: [CommonModule, NgClass],
    templateUrl: './game-list.component.html',
    styleUrl: './game-list.component.scss',
})
export class GameListComponent {
    games: Array<Game> = [];
    isSelected: boolean = false;

    selectGame() {
        this.isSelected = !this.isSelected;
    }

    getGames() {
        const testGame1: Game = {
            _id: 0,
            name: 'Ali',
            description: 'Un jeu de stratégie passionnant dans un monde médiéval.',
            visible: true,
            mode: 'Normal',
            nbPlayers: 4,
            image: 'assets/images/background/title_page_bgd10.jpg',
            dimension: '15x15',
        };
        const testGame2: Game = {
            _id: 1,
            name: 'Adventure Quest',
            description: "Partez à l'aventure dans des mondes mystérieux avec vos amis.",
            visible: true,
            mode: 'Capture the flag',
            nbPlayers: 6,
            image: 'assets/images/background/title_page_bgd10.jpg',
            dimension: '20x20',
        };
        const testGame3: Game = {
            _id: 2,
            name: 'Adventure Quest',
            description: "Partez à l'aventure dans des mondes mystérieux avec vos amis.",
            visible: true,
            mode: 'Capture the flag',
            nbPlayers: 6,
            image: 'assets/images/background/title_page_bgd10.jpg',
            dimension: '20x20',
        };
        const testGame4: Game = {
            _id: 3,
            name: 'Adventure Quest',
            description: "Partez à l'aventure dans des mondes mystérieux avec vos amis.",
            visible: true,
            mode: 'Capture the flag',
            nbPlayers: 6,
            image: 'assets/images/background/title_page_bgd10.jpg',
            dimension: '20x20',
        };

        this.games.push(testGame1, testGame2, testGame3, testGame4);
    }

    ngOnInit() {
        this.getGames();
    }
}
