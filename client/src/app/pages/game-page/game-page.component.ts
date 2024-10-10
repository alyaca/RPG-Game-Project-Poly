import { Component, Input } from '@angular/core';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { PlayerInfoInventoryComponent } from '@app/components/player-info-inventory/player-info-inventory.component';
import { IngamePlayersSidebarComponent } from '@app/components/ingame-players-sidebar/ingame-players-sidebar.component';
import { IngameSidebarPlayer, Status } from '@app/interfaces/ingameSidebarPlayer';
import { TimerComponent } from '@app/components/timer/timer.component';

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [GameGridComponent, PlayerInfoInventoryComponent, IngamePlayersSidebarComponent, TimerComponent],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent {
    @Input() selectedSize: string | null = 'small';
    mapName: string = 'Exemple';
    mapDescription: string = 'Ma tres courte description';
    resetTrigger: boolean = false;
    saveTrigger: boolean = false;

    isActionSelected: boolean = false;

    toggleActionSelected(){
        this.isActionSelected = !this.isActionSelected;
    }

    allPlayers: IngameSidebarPlayer[] = [
        {
            id: 0,
            avatar: '/assets/images/characters/Hephaestus.webp',
            status: Status.Player,
            name: 'Jar Jar Binks',
            victories: 2,
            isActive: true,
        },
        {
            id: 1,
            avatar: '/assets/images/characters/Zeus.webp',
            status: Status.Admin,
            name: 'Obi-Wan Kenobi',
            victories: 1,
            isActive: false,
        },
        {
            id: 2,
            avatar: '/assets/images/characters/Athena.webp',
            status: Status.Player,
            name: 'General Grievous',
            victories: 2,
            isActive: false,
        },
        {
            id: 3,
            avatar: '/assets/images/characters/Apollo.webp',
            status: Status.Player,
            name: 'Luke Skywalker',
            victories: 1,
            isActive: false,
        },
        {
            id: 4,
            avatar: '/assets/images/characters/Artemis.webp',
            status: Status.Bot,
            name: 'Leia Organa',
            victories: 0,
            isActive: false,
        },
        {
            id: 5,
            avatar: '/assets/images/characters/Hestia.webp',
            status: Status.Disconnected,
            name: 'Chewbacca',
            victories: 2,
            isActive: false,
        },
    ];
}
