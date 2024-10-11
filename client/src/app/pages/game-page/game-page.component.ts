import { Component, Input, OnInit } from '@angular/core';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { IngamePlayersSidebarComponent } from '@app/components/ingame-players-sidebar/ingame-players-sidebar.component';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { PlayerInfoInventoryComponent } from '@app/components/player-info-inventory/player-info-inventory.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { IngameSidebarPlayer, Status } from '@app/interfaces/ingameSidebarPlayer';

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [GameGridComponent, PlayerInfoInventoryComponent, IngamePlayersSidebarComponent, TimerComponent, CombatModalComponent],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent implements OnInit {
    @Input() selectedSize: string | null = 'small';
    mapName: string = 'Exemple';
    mapDescription: string = 'Ma tres courte description';
    resetTrigger: boolean = false;
    saveTrigger: boolean = false;

    isActionSelected: boolean = true;
    isInCombat = false;

    toggleActionSelected() {
        this.isActionSelected = !this.isActionSelected;
    }

    ngOnInit() {}

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

    openCombatModal() {
        this.isInCombat = true;
    }

    closeCombatModal() {
        this.isInCombat = false;
    }
}
