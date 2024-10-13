import { Component, ElementRef, Input, QueryList, ViewChildren, ViewChild } from '@angular/core';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { IngamePlayersSidebarComponent } from '@app/components/ingame-players-sidebar/ingame-players-sidebar.component';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { PlayerInfoInventoryComponent } from '@app/components/player-info-inventory/player-info-inventory.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { PLAYERS } from '@app/constants';
import { PlayerObjects } from '@app/interfaces/playerObject';

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [GameGridComponent, PlayerInfoInventoryComponent, IngamePlayersSidebarComponent, TimerComponent, CombatModalComponent],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent {
    @Input() selectedSize: string | null = 'small';
    @ViewChildren('pageElement') pageDiv: QueryList<ElementRef<HTMLDivElement>>;
    @ViewChild('turnTimer') turnTimerComponent!: TimerComponent;
    @ViewChild('startTimer') startTimerComponent!: TimerComponent;

    mapName: string = 'Exemple';
    mapDescription: string = 'Ma tres courte description';
    resetTrigger: boolean = false;
    saveTrigger: boolean = false;

    isActionSelected: boolean = true;
    isInCombat = false;
    isTurnStartShowed = true;

    enableClicks() {
        this.pageDiv.first.nativeElement.id = 'enabled';
    }

    closeTurnStartPopUp() {
        this.isTurnStartShowed = false;
        this.enableClicks();
        this.turnTimerComponent.resumeTimer();
    }

    toggleActionSelected() {
        this.isActionSelected = !this.isActionSelected;
    }

    ngAfterViewInit() {
        if (this.turnTimerComponent) {
            this.turnTimerComponent.pauseTimer();
        }
    }

    allPlayers: PlayerObjects[] = PLAYERS;

    openCombatModal() {
        this.isInCombat = true;
        this.turnTimerComponent.pauseTimer()
    }

    closeCombatModal() {
        this.isInCombat = false;
        this.turnTimerComponent.resumeTimer()
    }
}
