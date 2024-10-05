import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ACCESS_CODE_LENGTH, MAX_ACCESS_CODE_VALUE, MAX_PLAYER_SIZE_INT } from '@app/constants';
import { Map } from '@app/interfaces/map';
import { GameListService } from '@app/services/game-list.service';
import { LobbyPlayerComponent } from '@app/components/waiting-page/lobby-player/lobby-player.component';
import { LobbyPlayer, PlayerSize } from '@app/interfaces/lobbyPlayer';
@Component({
    selector: 'app-waiting-page',
    standalone: true,
    imports: [RouterLink, CommonModule, LobbyPlayerComponent],
    templateUrl: './waiting-page.component.html',
    styleUrl: './waiting-page.component.scss',
})
export class WaitingPageComponent implements OnInit {
    accessCode: string = '';
    maxRandom = MAX_ACCESS_CODE_VALUE;
    chosenGame: Map;

    // sample player lobby (to be generated dynamically later)
    players: LobbyPlayer[] = [
        {
            id: 0,
            name: '* joueur1',
            avatar: '/assets/images/characters/Hephaestus.webp',
            attributes: {
                attack: 4,
                defense: 4,
                health: 4,
                speed: 4,
            },
            isAdmin: false,
            size: PlayerSize.Medium,
        },
        {
            id: 1,
            name: 'joueur2',
            avatar: '/assets/images/characters/Athena.webp',
            attributes: {
                attack: 4,
                defense: 4,
                health: 4,
                speed: 4,
            },
            isAdmin: false,
            size: PlayerSize.Medium,
        },
        {
            id: 2,
            name: 'joueur3',
            avatar: '/assets/images/characters/Apollo.webp',
            attributes: {
                attack: 4,
                defense: 4,
                health: 4,
                speed: 4,
            },
            isAdmin: true,
            size: PlayerSize.Medium,
        },
        {
            id: 3,
            name: 'joueur4',
            avatar: '/assets/images/characters/Demeter.webp',
            attributes: {
                attack: 4,
                defense: 4,
                health: 4,
                speed: 4,
            },
            isAdmin: false,
            size: PlayerSize.Medium,
        },
        {
            id: 4,
            name: 'joueur5',
            avatar: '/assets/images/characters/Poseidon.webp',
            attributes: {
                attack: 4,
                defense: 4,
                health: 4,
                speed: 4,
            },
            isAdmin: false,
            size: PlayerSize.Medium,
        },
        {
            id: 5,
            name: 'joueur6',
            avatar: '/assets/images/characters/Hestia.webp',
            attributes: {
                attack: 4,
                defense: 4,
                health: 4,
                speed: 4,
            },
            isAdmin: false,
            size: PlayerSize.Medium,
        },
    ];

    private readonly accesCodeLength = ACCESS_CODE_LENGTH;

    constructor(
        private gameListService: GameListService,
        private router: Router,
    ) {
        this.gameListService.chosenGameSubject.subscribe((game: Map | null) => {
            if (game) {
                this.chosenGame = game;
            }
        });
        this.attributeSizeDynamically();
    }

    ngOnInit() {
        this.accessCode = this.generateAccesCode();
        if (!this.gameListService.chosenGameSubject.getValue()) {
            this.router.navigate(['/game-creation']);
        }
    }

    generateAccesCode(): string {
        const code = Math.floor(Math.random() * this.maxRandom);
        return code.toString().padStart(this.accesCodeLength, '0');
    }

    attributeSizeDynamically() {
        const len: number = this.players.length;
        let playerSizeInteger: number = MAX_PLAYER_SIZE_INT;
        const midpoint: number = Math.floor(len / 2);

        for (let i = midpoint; i < len; i++) {
            this.players[i].size = this.getPlayerSize(playerSizeInteger);
            playerSizeInteger--;
        }

        playerSizeInteger = len % 2 === 1 ? MAX_PLAYER_SIZE_INT - 1 : MAX_PLAYER_SIZE_INT;
        for (let i = midpoint - 1; i >= 0; i--) {
            this.players[i].size = this.getPlayerSize(playerSizeInteger);
            playerSizeInteger--;
        }
    }

    getPlayerSize(val: number): PlayerSize {
        if (val >= MAX_PLAYER_SIZE_INT) {
            return PlayerSize.Big;
        } else if (val === 1) {
            return PlayerSize.Medium;
        } else {
            return PlayerSize.Small;
        }
    }
}
