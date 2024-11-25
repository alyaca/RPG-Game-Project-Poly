import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { IngamePlayersSidebarComponent } from '@app/components/ingame-players-sidebar/ingame-players-sidebar.component';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { PlayerInfoInventoryComponent } from '@app/components/player-info-inventory/player-info-inventory.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import {
    DEFAULT_ACTION_POINT,
    DialogMessages,
    DialogOptions,
    DialogResult,
    DialogTitle,
    INFO_DIALOG_TIME,
    STARTING_TIME,
    TURN_TIME,
} from '@app/constants';
import { CombatService } from '@app/services/combat/combat.service';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { PostGameService } from '@app/services/post-game/post-game.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player, Status } from '@common/player';
import { Room } from '@common/room';

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [
        GameGridComponent,
        PlayerInfoInventoryComponent,
        IngamePlayersSidebarComponent,
        TimerComponent,
        CombatModalComponent,
        ChatBoxComponent,
        CommonModule,
    ],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss',
})
export class GamePageComponent implements OnInit, AfterViewInit {
    @Input() selectedSize: string | null = 'small';
    @ViewChildren('pageElement') pageDiv: QueryList<ElementRef<HTMLDivElement>>;
    @ViewChild('turnTimer') turnTimer!: TimerComponent;

    allPlayers: Player[];
    mapName: string;
    mapDimensions: string;
    resetTrigger: boolean = false;
    saveTrigger: boolean = false;
    activePlayerName: string | null;
    activePlayer: Player;

    isActivePlayer: boolean = false;
    isInCombat: boolean = false;
    isTurnStartShowed: boolean = false;
    timeRemainingBeforeStartTurn: number = STARTING_TIME;
    timeRemainingStartTurn: number = TURN_TIME;
    isFirstTimerDone: boolean = false;
    beforeTurnTotalTime: number = STARTING_TIME;
    turnTotalTime: number = TURN_TIME;

    doorAround: boolean = false;
    attackAround: boolean = false;

    private router = inject(Router);
    private postGameService = inject(PostGameService);
    constructor(
        private gameCreationService: GameCreationService,
        public socketCommunicationService: SocketCommunicationService,
        public gameService: GameService,
        private navigationService: NavigationService,
        public combatService: CombatService,
    ) {
        this.mapName = this.gameCreationService.loadedMapName;
        this.mapDimensions = this.findMapDimensions();
    }

    ngOnInit() {
        if (!this.mapDimensions || !this.mapName) {
            this.router.navigate(['/home']);
        }

        this.socketCommunicationService.on<Room>('mapInformation', (room: Room) => {
            this.allPlayers = room.listPlayers;
            this.activePlayer = this.allPlayers[0];
            this.replenishHealth();
            this.onBeforeStartTurn();
        });
        this.socketCommunicationService.on('disconnectedPlayer', (listPlayers: Player[]) => {
            this.allPlayers = listPlayers;
        });
        this.socketCommunicationService.on('draw', () => {
            this.socketCommunicationService.disconnect();
            this.handleDraw();
        });
        this.socketCommunicationService.on('otherPlayerTurn', (name: string) => {
            this.activePlayerName = name;
        });

        this.socketCommunicationService.on('startFight', (data: { player1: Player; player2: Player; isPlayer1Active: boolean }) => {
            this.combatService.isInCombat = true;
            this.combatService.initializeCombat(data.player1, data.player2, data.isPlayer1Active);
        });

        this.socketCommunicationService.on('combatEnd', (data: { listPlayers: Player[]; player: Player }) => {
            this.setPlayersOnCombatDone(data.listPlayers);
            this.navigationService.players = data.listPlayers;
            this.combatService.onCombatEnd(data.player);
        });

        this.socketCommunicationService.on('evasionSuccess', (data: { listPlayers: Player[]; player: Player }) => {
            this.setPlayersOnCombatDone(data.listPlayers);
            this.combatService.onEvasion(data.player);
        });

        this.socketCommunicationService.on('playerFell', () => {
            this.onPlayerFell();
        });

        this.socketCommunicationService.on('doorAround', (doorAround: boolean) => {
            this.doorAround = doorAround;
        });

        this.socketCommunicationService.on('doorClicked', () => {
            this.activePlayer.attributes.actionPoints = 0;
        });

        this.socketCommunicationService.on('attackAround', (attackAround: boolean) => {
            this.attackAround = attackAround;
        });

        this.socketCommunicationService.once('endGame', (data: { winner: Player; room: Room }) => {
            this.removeListeners();
            this.postGameService.transferRoomStats(data.room);

            this.gameService
                .openDialog({
                    title: DialogTitle.EndGame,
                    messages: ['Le gagnant de la partie est : ' + data.winner.name],
                    options: [DialogOptions.Close],
                    confirm: false,
                })
                .subscribe((result) => {
                    if (result.action === DialogResult.Close) {
                        this.router.navigate(['/post-game-lobby']);
                    }
                });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'd') {
                if (this.isPlayerAdmin()) {
                    this.navigationService.isDebugMode = !this.navigationService.isDebugMode;
                    this.socketCommunicationService.send('debugMode', this.navigationService.isDebugMode);
                }
            }
        });

        this.socketCommunicationService.on('debugMode', (debugMode: boolean) => {
            this.navigationService.isDebugMode = debugMode;
        });
    }

    ngAfterViewInit() {
        this.socketCommunicationService.on('isActive', (activePlayer: Player) => {
            this.isActivePlayer = activePlayer.id === this.socketCommunicationService.socket.id;
            const playerToAssign = this.navigationService.players.find((player) => player.id === activePlayer.id);
            if (playerToAssign) {
                this.activePlayer = playerToAssign;
            }
            this.isTurnStartShowed = this.isActivePlayer;
        });
        this.timerEvents();
    }

    timerEvents() {
        this.socketCommunicationService.on('beforeStartTurnTimer', (timeRemaining: number) => {
            this.timeRemainingBeforeStartTurn = timeRemaining;
        });
        this.socketCommunicationService.on('turnEnded', (listPlayers: Player[]) => {
            this.allPlayers = listPlayers;
            this.onBeforeStartTurn();
        });
        this.socketCommunicationService.on('startedTurnTimer', (timeRemaining: number) => {
            this.closeTurnStartPopUp();
            this.timeRemainingStartTurn = timeRemaining;
            this.turnTimer.updateProgress();
        });
    }

    removeListeners() {
        this.socketCommunicationService.off('beforeStartTurnTimer');
        this.socketCommunicationService.off('turnEnded');
        this.socketCommunicationService.off('startedTurnTimer');
        this.socketCommunicationService.off('draw');
    }

    onBeforeStartTurn() {
        this.gameService.isActionCombatSelected = false;
        this.gameService.isActionDoorSelected = false;
        this.activePlayer.attributes.actionPoints = DEFAULT_ACTION_POINT;
        this.socketCommunicationService.send('startTurn');
    }

    isDebugMode(): boolean {
        return this.navigationService.isDebugMode;
    }

    onPlayerFell() {
        this.gameService.openTempDialog({ title: DialogTitle.EndTurn, message: DialogMessages.Fell, duration: INFO_DIALOG_TIME }).subscribe(() => {
            this.onEndTurn();
        });
    }

    setPlayersOnCombatDone(players: Player[]) {
        this.allPlayers = players;
        this.combatService.isRolling = false;
        this.activePlayer.attributes.actionPoints = 0;
    }

    getPlayerCount() {
        return this.allPlayers ? this.allPlayers.length : -1;
    }

    findMapDimensions(): string {
        const mapSize = this.gameCreationService.updateDimensions();
        return mapSize + ' x ' + mapSize;
    }

    replenishHealth() {
        for (const player of this.allPlayers) {
            player.attributes.currentHp = player.attributes.totalHp;
        }
    }

    enableClicks() {
        if (this.pageDiv && this.pageDiv.length > 0) {
            this.pageDiv.first.nativeElement.id = 'enabled';
        }
    }

    closeTurnStartPopUp() {
        this.isTurnStartShowed = false;
        this.isFirstTimerDone = true;
        this.beforeTurnTotalTime = STARTING_TIME;
        this.activePlayerName = null;
        this.enableClicks();
    }

    toggleActionDoorSelected() {
        this.gameService.isActionDoorSelected = !this.gameService.isActionDoorSelected;
        this.gameService.isActionCombatSelected = false;
    }

    toggleActionCombatSelected() {
        this.gameService.isActionCombatSelected = !this.gameService.isActionCombatSelected;
        this.gameService.isActionDoorSelected = false;
    }

    handleExit() {
        this.gameService
            .openDialog({
                title: DialogTitle.QuitGame,
                messages: [DialogMessages.QuitGame],
                options: [DialogOptions.Quit, DialogOptions.Stay],
                confirm: true,
            })
            .subscribe((result) => {
                if (result.action === DialogResult.Left) {
                    if (this.isPlayerAdmin()) {
                        this.navigationService.isDebugMode = false;
                        this.socketCommunicationService.send('debugMode', this.navigationService.isDebugMode);
                    }
                    this.socketCommunicationService.disconnect();
                    this.router.navigate(['/home']);
                }
            });
    }

    handleDraw() {
        this.gameService
            .openDialog({
                title: DialogTitle.DrawGame,
                messages: [DialogMessages.DrawGame],
                options: [DialogOptions.Close],
                confirm: false,
            })
            .subscribe((result) => {
                if (result.action === DialogResult.Close) {
                    this.socketCommunicationService.disconnect();
                    this.router.navigate(['/home']);
                }
            });
    }

    onEndTurn() {
        this.socketCommunicationService.send('endTurn');
    }

    hasActionPoints() {
        return this.gameService.hasActionPoints(this.activePlayer);
    }

    forceEndGame() {
        this.socketCommunicationService.send('forceEndGame', this.allPlayers[0]);
    }

    isPlayerAdmin(): boolean {
        const admin = this.allPlayers.find((player) => player.status === Status.Admin);
        const currentPlayer = this.allPlayers.find((player) => player.id === this.socketCommunicationService.socket.id);
        return !!(currentPlayer && admin && currentPlayer.id === admin.id);
    }

    isCombatStarted() {
        return this.combatService.isInCombat;
    }
}
