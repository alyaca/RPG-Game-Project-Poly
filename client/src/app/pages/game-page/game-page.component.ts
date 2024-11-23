import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { IngamePlayersSidebarComponent } from '@app/components/ingame-players-sidebar/ingame-players-sidebar.component';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { PlayerInfoInventoryComponent } from '@app/components/player-info-inventory/player-info-inventory.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { DEFAULT_ACTION_POINT, DialogMessages, DialogOptions, DialogResult, DialogTitle, STARTING_TIME, TURN_TIME } from '@app/constants';
import { CombatService } from '@app/services/combat/combat.service';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { PostGameService } from '@app/services/post-game/post-game.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { StopwatchService } from '@app/services/stopwatch/stopwatch.service';
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
    private stopwatchService = inject(StopwatchService);
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
        this.stopwatchService.start();
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

        this.socketCommunicationService.on('combatEnd', (listPlayers: Player[]) => {
            this.allPlayers = listPlayers;
            this.navigationService.players = listPlayers;
            this.combatService.isInCombat = false;
            this.activePlayer.attributes.actionPoints = 0;
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

        this.socketCommunicationService.once('endGame', (data: {winner: Player, room: Room}) => {
            // place in function (maybe in postGameService make a method that takes into parameter room)
            this.stopwatchService.stop();
            this.postGameService.globalStats.turns = data.room.globalPostGameStats.turns;
            this.postGameService.tilesGrid = data.room.gameMap.tiles;
            this.postGameService.players = data.room.listPlayers;
            this.postGameService.globalStats.globalTilesVisited = data.room.globalPostGameStats.globalTilesVisited;
            this.postGameService.globalStats.doorsInteracted = data.room.globalPostGameStats.doorsInteracted;

            for (const player of this.postGameService.players) {
                const matchingPlayer = data.room.listPlayers.find(p => p.id === player.id);
                if (matchingPlayer) {
                    player.positionHistory = matchingPlayer.positionHistory;
                }
            }
            // this.postGameService.transferRoomStats(data.room);
            
            // for(const position of this.postGameService.globalStats.globalTilesVisited){
            //     console.log('('+position.x+', '+position.y+')');
            // }
            
            this.socketCommunicationService.off('draw');
            this.gameService
                .openDialog({
                    title: DialogTitle.EndGame,
                    messages: ['Le gagnant de la partie est : ' + data.winner.name],
                    options: [DialogOptions.Close],
                    confirm: false,
                })
                .subscribe((result) => {
                    if (result === DialogResult.Close) {
                        this.router.navigate(['/post-game-lobby']);
                    }
                });
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

    hasActionPoints() {
        return this.gameService.hasActionPoints(this.activePlayer);
    }

    forceEndGame() {
        this.socketCommunicationService.send('forceEndGame', this.allPlayers[0]);
        // server.to(room.roomId).emit('endGame', player);
    }
}
