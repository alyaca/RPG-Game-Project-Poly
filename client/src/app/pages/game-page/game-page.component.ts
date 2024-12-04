import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { IngamePlayersSidebarComponent } from '@app/components/ingame-players-sidebar/ingame-players-sidebar.component';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { PlayerInfoInventoryComponent } from '@app/components/player-info-inventory/player-info-inventory.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { DialogMessages, DialogOptions, DialogResult, DialogTitle, INFO_DIALOG_TIME, STARTING_TIME, TURN_TIME } from '@app/constants';
import { StartFightData } from '@app/interfaces/event-data';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { PostGameService } from '@app/services/post-game/post-game.service';
import { CombatService } from '@app/services/sockets/combat/combat.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { ItemSwap } from '@common/interfaces/item-swap';
import { Player, Position, Status } from '@common/interfaces/player';
import { Room } from '@common/interfaces/room';
import { PathRoute } from '@common/interfaces/route';
import { gameObjects } from '@common/objects-info';
import { ClientToServerEvent, ServerToClientEvent } from '@common/socket.events';

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
    activePlayerName: string | null;
    activePlayer: Player;
    isActivePlayer: boolean = false;
    isInCombat: boolean = false;
    combatInProgress: boolean = false;
    isTurnStartShowed: boolean = false;
    timeRemainingBeforeStartTurn: number = STARTING_TIME;
    timeRemainingStartTurn: number = TURN_TIME;
    beforeTurnTotalTime: number = STARTING_TIME;
    turnTotalTime: number = TURN_TIME;
    doorAround: boolean = false;
    attackAround: boolean = false;

    private gameService = inject(GameService);
    private router = inject(Router);
    private isChatFocus: boolean = false;
    private keyDownListener: (event: KeyboardEvent) => void;
    private postGameService = inject(PostGameService);
    constructor(
        private gameCreationService: GameCreationService,
        private socketCommunicationService: SocketCommunicationService,
        private combatService: CombatService,
        private navigationService: NavigationService,
    ) {
        this.mapName = this.gameCreationService.loadedMapName;
        this.mapDimensions = this.findMapDimensions();
        this.combatService.isInCombat = false;
    }

    getSocketId() {
        return this.socketCommunicationService.socket.id;
    }

    ngOnInit() {
        if (!this.mapDimensions || !this.mapName) {
            this.router.navigate([PathRoute.HOME]);
        }

        this.socketCommunicationService.on<Room>(ServerToClientEvent.MapInformation, (room: Room) => {
            this.allPlayers = room.listPlayers;
            this.activePlayer = this.allPlayers[0];
            this.replenishHealth();
            this.onBeforeStartTurn();
        });

        this.socketCommunicationService.on(ServerToClientEvent.UpdatePlayerList, (listPlayers: Player[]) => {
            this.allPlayers = listPlayers;
        });

        this.socketCommunicationService.on(ServerToClientEvent.UpdateAllPlayers, (listPlayers: Player[]) => {
            this.allPlayers = listPlayers;
        });

        this.socketCommunicationService.on(ServerToClientEvent.DrawGame, () => {
            this.socketCommunicationService.disconnect();
            this.handleDraw();
        });

        this.socketCommunicationService.on(ServerToClientEvent.OtherPlayerTurn, (name: string) => {
            this.activePlayerName = name;
        });

        this.socketCommunicationService.on(ServerToClientEvent.StartFight, (startFightData: StartFightData) => {
            this.combatService.isInCombat = true;
            this.activePlayer.attributes.actionPoints--;
            this.gameService.isActionCombatSelected = false;
            this.combatService.initializeCombat(startFightData.combatPlayers, startFightData.isActivePlayerAttacker);
        });

        this.socketCommunicationService.on(ServerToClientEvent.CombatInProgress, () => {
            this.combatInProgress = true;
        });

        this.socketCommunicationService.on(ServerToClientEvent.CombatOver, () => {
            this.combatInProgress = false;
        });

        this.socketCommunicationService.on(ServerToClientEvent.CombatEnd, (data: { listPlayers: Player[]; player: Player }) => {
            this.setPlayersOnCombatDone(data.listPlayers);
            this.navigationService.players = data.listPlayers;
            this.combatService.onCombatEnd(data.player);
        });

        this.socketCommunicationService.on(ServerToClientEvent.EvasionSuccess, (data: { listPlayers: Player[]; player: Player }) => {
            this.setPlayersOnCombatDone(data.listPlayers);
            this.combatService.onEvasion(data.player);
        });

        this.socketCommunicationService.on(ServerToClientEvent.PlayerFell, () => {
            this.onPlayerFell();
        });

        this.socketCommunicationService.on(ServerToClientEvent.DoorAround, (data: { doorAround: boolean; targets: Position[] }) => {
            this.doorAround = data.doorAround;
            this.gameService.doorsTarget = data.targets;
        });

        this.socketCommunicationService.on(ServerToClientEvent.DoorClicked, () => {
            this.activePlayer.attributes.actionPoints--;
        });

        this.socketCommunicationService.on(ServerToClientEvent.AttackAround, (data: { attackAround: boolean; targets: Player[] }) => {
            this.attackAround = data.attackAround;
            this.gameService.playersTarget = data.targets;
        });

        this.socketCommunicationService.once(ServerToClientEvent.EndGame, (data: { winner: Player; room: Room }) => {
            if (this.navigationService.isDebugMode) {
                this.navigationService.isDebugMode = false;
                this.socketCommunicationService.send(ClientToServerEvent.DebugMode, this.navigationService.isDebugMode);
            }
            this.removeListeners();
            this.postGameService.transferRoomStats(data.room);

            this.gameService
                .openDialog({
                    title: DialogTitle.EndGame,
                    messages: ['Le gagnant de la partie est : ' + data.winner.name],
                    options: [DialogOptions.Close],
                    confirm: false,
                    image: data.winner.avatar?.src,
                })
                .subscribe((result) => {
                    if (result.action === DialogResult.Close) {
                        this.router.navigate(['/post-game-lobby'], { queryParams: { roomCode: data.room.roomId } });
                    }
                });
        });

        this.toggleDebugMode();
        document.addEventListener('keydown', this.keyDownListener);

        this.socketCommunicationService.on(ServerToClientEvent.DebugMode, (debugMode: boolean) => {
            this.navigationService.isDebugMode = debugMode;
        });

        this.socketCommunicationService.on(ServerToClientEvent.OpenItemSwitchModal, (data: { activePlayer: Player; itemPickedUp: number }) => {
            const oldInventory = JSON.parse(JSON.stringify(data.activePlayer.inventory));
            const fullItem = gameObjects.find((items) => items.id === data.itemPickedUp);
            if (!fullItem) return;
            const itemSwap: ItemSwap = {
                currentItem1: data.activePlayer.inventory[0],
                currentItem2: data.activePlayer.inventory[1],
                pickedUpItem: fullItem,
            };
            this.gameService
                .openDialog({
                    title: DialogTitle.ItemExchange,
                    messages: [`Quel objet voulez échangé pour celui-ci: ${fullItem?.name}`],
                    options: [],
                    confirm: false,
                    itemSwap,
                })
                .subscribe(() => {
                    this.socketCommunicationService.send(ClientToServerEvent.ItemSwapped, {
                        inventoryToUndo: oldInventory,
                        newInventory: data.activePlayer.inventory,
                        droppedItem: itemSwap.pickedUpItem.id,
                    });
                });
        });
    }

    isActionDoorSelected() {
        return this.gameService.isActionDoorSelected;
    }

    isActionCombatSelected() {
        return this.gameService.isActionCombatSelected;
    }

    ngAfterViewInit() {
        this.socketCommunicationService.on(ServerToClientEvent.ActivePlayer, (activePlayer: Player) => {
            this.activePlayer = activePlayer;
            this.isActivePlayer = activePlayer.id === this.socketCommunicationService.socket.id;
            this.isTurnStartShowed = this.isActivePlayer;
        });
        this.timerEvents();
    }

    timerEvents() {
        this.socketCommunicationService.on(ServerToClientEvent.BeforeStartTurnTimer, (timeRemaining: number) => {
            this.timeRemainingBeforeStartTurn = timeRemaining;
        });
        this.socketCommunicationService.on(ServerToClientEvent.TurnEnded, () => {
            this.onBeforeStartTurn();
        });
        this.socketCommunicationService.on(ServerToClientEvent.UpdateVisual, (listPlayers: Player[]) => {
            this.allPlayers = listPlayers;
        });
        this.socketCommunicationService.on(ServerToClientEvent.StartedTurnTimer, (timeRemaining: number) => {
            this.closeTurnStartPopUp();
            this.timeRemainingStartTurn = timeRemaining;
            this.turnTimer.updateProgress();
        });
    }

    removeListeners() {
        this.socketCommunicationService.off(ServerToClientEvent.ActivePlayer);
        this.socketCommunicationService.off(ServerToClientEvent.AttackAround);
        this.socketCommunicationService.off(ServerToClientEvent.BeforeStartTurnTimer);
        this.socketCommunicationService.off(ServerToClientEvent.CombatEnd);
        this.socketCommunicationService.off(ServerToClientEvent.DebugMode);
        this.socketCommunicationService.off(ServerToClientEvent.DrawGame);
        this.socketCommunicationService.off(ServerToClientEvent.DoorAround);
        this.socketCommunicationService.off(ServerToClientEvent.DoorClicked);
        this.socketCommunicationService.off(ServerToClientEvent.EndGame);
        this.socketCommunicationService.off(ServerToClientEvent.EvasionSuccess);
        this.socketCommunicationService.off(ServerToClientEvent.OpenItemSwitchModal);
        this.socketCommunicationService.off(ServerToClientEvent.StartedTurnTimer);
        this.socketCommunicationService.off(ServerToClientEvent.StartFight);
        this.socketCommunicationService.off(ServerToClientEvent.TurnEnded);
    }

    onChatFocus(isFocus: boolean) {
        this.isChatFocus = isFocus;
        this.toggleDebugMode();
    }

    toggleDebugMode() {
        this.keyDownListener = (event: KeyboardEvent) => {
            if (!this.isChatFocus && event.key === 'd' && this.isPlayerAdmin()) {
                this.navigationService.isDebugMode = !this.navigationService.isDebugMode;
                this.socketCommunicationService.send(ClientToServerEvent.DebugMode, this.navigationService.isDebugMode);
            }
        };
    }

    onBeforeStartTurn() {
        this.gameService.isActionCombatSelected = false;
        this.gameService.isActionDoorSelected = false;
        this.socketCommunicationService.send(ClientToServerEvent.StartTurn);
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
        this.activePlayer.attributes.actionPoints -= 1;
    }

    getPlayerCount() {
        return this.allPlayers ? this.allPlayers.length : -1;
    }

    findMapDimensions(): string {
        const mapSize = this.gameCreationService.updateDimensions();
        return mapSize + ' x ' + mapSize;
    }

    replenishHealth() {
        this.allPlayers?.forEach((player) => {
            player.attributes.currentHp = player.attributes.totalHp;
        });
    }

    enableClicks() {
        if (this.pageDiv && this.pageDiv.length > 0) {
            this.pageDiv.first.nativeElement.id = 'enabled';
        }
    }

    closeTurnStartPopUp() {
        this.isTurnStartShowed = false;
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
                        this.socketCommunicationService.send(ClientToServerEvent.DebugMode, this.navigationService.isDebugMode);
                    }
                    this.socketCommunicationService.disconnect();
                    this.router.navigate([PathRoute.HOME]);
                }
            });
    }

    handleDraw() {
        this.router.navigate([PathRoute.HOME]);
        this.gameService.openTempDialog({
            title: DialogTitle.DrawGame,
            message: DialogMessages.DrawGame,
            duration: INFO_DIALOG_TIME,
        });
    }

    onEndTurn() {
        this.socketCommunicationService.send(ClientToServerEvent.EndTurn);
    }

    ngOnDestroy() {
        document.removeEventListener('keydown', this.keyDownListener);
    }

    hasActionPoints() {
        return this.gameService.hasActionPoints(this.activePlayer);
    }

    // To remove after stats done
    forceEndGame() {
        this.socketCommunicationService.send(ClientToServerEvent.ForceEndGame, this.allPlayers[0]);
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
