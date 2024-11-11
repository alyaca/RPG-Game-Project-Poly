import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { IngamePlayersSidebarComponent } from '@app/components/ingame-players-sidebar/ingame-players-sidebar.component';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { PlayerInfoInventoryComponent } from '@app/components/player-info-inventory/player-info-inventory.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { DEFAULT_ACTION_POINT, DialogMessages, DialogOptions, DialogResult, DialogTitle, STARTING_TIME, TURN_TIME } from '@app/constants';
//import { CombatService } from '@app/services/combat/combat.service';
import { CombatService } from '@app/services/combat/combat.service';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';
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
export class GamePageComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() selectedSize: string | null = 'small';
    @ViewChildren('pageElement') pageDiv: QueryList<ElementRef<HTMLDivElement>>;

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
    combatTurnTime: number;
    isDebugMode: boolean = false;

    constructor(
        private router: Router,
        private gameCreationService: GameCreationService,
        public socketCommunicationService: SocketCommunicationService,
        public gameService: GameService,
        private navigationService: NavigationService, //private combatService: CombatService,
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

        this.socketCommunicationService.on('startFight', (data: { player1: Player; player2: Player }) => {
            this.isInCombat = true;
            this.combatService.initializeCombat(data.player1, data.player2);
        });

        this.socketCommunicationService.on('combatEnd', (listPlayers: Player[]) => {
            this.allPlayers = listPlayers;
            this.activePlayer.attributes.actionPoints = 0;
            this.closeCombatModal();
        });

        this.socketCommunicationService.on('playerFell', () => {
            this.onPlayerFell();
        });

        this.socketCommunicationService.on('endGame', (winner: Player) => {
            this.socketCommunicationService.off('draw');
            this.gameService
                .openDialog({
                    title: DialogTitle.EndGame,
                    messages: ['Le gagnant de la partie est : ' + winner.name],
                    options: [DialogOptions.Close],
                    confirm: false,
                })
                .subscribe((result) => {
                    if (result === DialogResult.Close) {
                        this.router.navigate(['/home']);
                    }
                });
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'd' || event.key === 'D') {
                const admin = this.allPlayers.find((player) => player.status === 'admin');
                const currentPlayer = this.allPlayers.find((player) => player.id === this.socketCommunicationService.socket.id)
                if (currentPlayer && admin && currentPlayer.id === admin.id) {
                    //ca fait undefined la deuxime fois a la place de false 
                    this.isDebugMode = !this.isDebugMode;
                    this.socketCommunicationService.send('debugMode', this.isDebugMode);
                }
            }
        });
    }

    ngAfterViewInit() {
        this.socketCommunicationService.on('isActive', (playerId: string) => {
            this.isActivePlayer = playerId === this.socketCommunicationService.socket.id;
            const playerToAssign = this.navigationService.players.find((player) => player.id === playerId);
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
        });
    }

    onBeforeStartTurn() {
        this.gameService.isActionCombatSelected = false;
        this.gameService.isActionDoorSelected = false;
        this.activePlayer.attributes.actionPoints = DEFAULT_ACTION_POINT;
        this.socketCommunicationService.send('startTurn');
    }

    onPlayerFell() {
        this.gameService
            .openDialog({ title: DialogTitle.EndTurn, messages: [DialogMessages.Fell], confirm: false, options: [DialogOptions.Close] })
            .subscribe((result) => {
                if (result === DialogResult.Close) {
                    this.onEndTurn();
                }
            });
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

    openCombatModal() {
        const player1 = this.navigationService.getActivePlayer();
        const player2 = this.navigationService.checkAttack();
        this.navigationService.getActivePlayer().attributes.actionPoints = 0;
        this.socketCommunicationService.send('startFight', { player1, player2 });
    }

    closeCombatModal() {
        this.isInCombat = false;
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
                if (result === DialogResult.Left) {
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
                if (result === DialogResult.Close) {
                    this.socketCommunicationService.disconnect();
                    this.router.navigate(['/home']);
                }
            });
    }

    onEndTurn() {
        this.socketCommunicationService.send('endTurn');
    }

    ngOnDestroy() {
        this.socketCommunicationService.disconnect();
    }

    checkDoors() {
        if (this.activePlayer) {
            if (this.navigationService.checkDoor()) {
                return true;
            }
        }

        return false;
    }

    checkAttack() {
        if (this.activePlayer) {
            if (this.navigationService.checkAttack() && this.hasActionPoints()) {
                return true;
            }
        }
        return false;
    }

    hasActionPoints() {
        return this.gameService.hasActionPoints(this.activePlayer);
    }
}
