import { Component, ElementRef, Input, QueryList, ViewChildren, ViewChild, AfterViewInit } from '@angular/core';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { IngamePlayersSidebarComponent } from '@app/components/ingame-players-sidebar/ingame-players-sidebar.component';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { PlayerInfoInventoryComponent } from '@app/components/player-info-inventory/player-info-inventory.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { PLAYERS } from '@app/constants';
import { PlayerObjects } from '@app/interfaces/playerObject';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [GameGridComponent, PlayerInfoInventoryComponent, IngamePlayersSidebarComponent, TimerComponent, CombatModalComponent],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent implements AfterViewInit {
    @Input() selectedSize: string | null = 'small';
    @ViewChildren('pageElement') pageDiv: QueryList<ElementRef<HTMLDivElement>>;
    @ViewChild('turnTimer') turnTimerComponent!: TimerComponent;
    @ViewChild('startTimer') startTimerComponent!: TimerComponent;

    allPlayers: PlayerObjects[] = PLAYERS;
    mapName: string = 'Exemple';
    mapDescription: string = 'Ma tres courte description';
    resetTrigger: boolean = false;
    saveTrigger: boolean = false;

    isActionSelected: boolean = true;
    isInCombat = false;
    isTurnStartShowed = true;

    constructor(private router: Router, private dialog: MatDialog) {}
       
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

    openCombatModal() {
        this.isInCombat = true;
        this.turnTimerComponent.pauseTimer();
    }

    closeCombatModal() {
        this.isInCombat = false;
        this.turnTimerComponent.resumeTimer();
    }

    handleExit() {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Abandonner la partie?',
                messages: ["- Êtes-vous certains de vouloir quitter?"],
                options: ['Quitter', 'Rester'],
                confirm: true,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === 'left') {
                this.router.navigate(['/home']);
            }
        });
    }
}
