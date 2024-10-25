import { AfterViewInit, Component, ElementRef, Input, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { IngamePlayersSidebarComponent } from '@app/components/ingame-players-sidebar/ingame-players-sidebar.component';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { PlayerInfoInventoryComponent } from '@app/components/player-info-inventory/player-info-inventory.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { Status } from '@app/interfaces/player-object';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { Player } from '@common/player';
import { GameCreationService } from '@app/services/game-creation.service';

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [GameGridComponent, PlayerInfoInventoryComponent, IngamePlayersSidebarComponent, TimerComponent, CombatModalComponent, ChatBoxComponent],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent implements AfterViewInit {
    @Input() selectedSize: string | null = 'small';
    @ViewChildren('pageElement') pageDiv: QueryList<ElementRef<HTMLDivElement>>;
    @ViewChild('turnTimer') turnTimerComponent!: TimerComponent;
    @ViewChild('startTimer') startTimerComponent!: TimerComponent;

    allPlayers: Player[] = mockLobbyPlayers;
    mapName: string = 'Exemple';
    mapDescription: string = 'Ma tres courte description';
    mapDimensions: string = '';
    resetTrigger: boolean = false;
    saveTrigger: boolean = false;

    isActionSelected: boolean = true;
    isInCombat: boolean = false;
    isTurnStartShowed: boolean = true;


    constructor(
        private router: Router,
        private dialog: MatDialog,
        private gameCreationService: GameCreationService,
    ) {
        this.determinePlayerTurn();
        this.mapName = this.gameCreationService.loadedMapName;
        this.mapDimensions = this.findMapDimensions();
    }

    findMapDimensions(): string{
        const mapSize = this.gameCreationService.updateDimensions();
        return mapSize + " x " + mapSize;
    }


    determinePlayerTurn() {
        this.allPlayers.sort((player1, player2) => player2.attributes.speed - player1.attributes.speed);
        this.allPlayers = [
            ...this.allPlayers.filter((player) => player.status !== Status.Disconnected),
            ...this.allPlayers.filter((player) => player.status === Status.Disconnected),
        ];
    }

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
                messages: ['- Êtes-vous certains de vouloir quitter?'],
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
