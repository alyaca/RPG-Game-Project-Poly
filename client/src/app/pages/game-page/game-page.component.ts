import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { CombatModalComponent } from '@app/components/combat-modal/combat-modal.component';
import { IngamePlayersSidebarComponent } from '@app/components/ingame-players-sidebar/ingame-players-sidebar.component';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { PlayerInfoInventoryComponent } from '@app/components/player-info-inventory/player-info-inventory.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { DialogMessages, DialogOptions, DialogResult, DialogTitle, ObjectType, STARTING_TIME, TURN_TIME } from '@app/constants';
import { gameObjects } from '@app/objects-info';
// import { CombatService } from '@app/services/combat/combat.service';
import { CombatService } from '@app/services/combat/combat.service';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { PlayerInventoryService } from '@app/services/player-inventory/player-inventory.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { ItemSwap } from '@common/item-swap';
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

    private playerInventoryService = inject(PlayerInventoryService);
    private gameService = inject(GameService);
    private navigationService = inject(NavigationService);

    constructor(
        private router: Router,
        private gameCreationService: GameCreationService,
        public socketCommunicationService: SocketCommunicationService,
        // private combatService: CombatService,
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
            // will have to check this for tests
            this.activePlayer.attributes.actionPoints -= 1;
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
                    itemSwap: null,
                })
                .subscribe((result) => {
                    if (result === DialogResult.Close) {
                        this.router.navigate(['/home']);
                    }
                });
        });

        this.socketCommunicationService.on('openItemSwitchModal', (data: { activePlayer: Player; item: number; objects: number[][] }) => {
            const oldInventory = JSON.parse(JSON.stringify(data.activePlayer.inventory));
            let notRandomItem = data.item;
            if (notRandomItem === ObjectType.Random) {
                notRandomItem = this.playerInventoryService.determineRandomItem(data.objects);
            }
            const itemToExchange = gameObjects.find((object) => object.id === notRandomItem);
            if (!itemToExchange) {
                return;
            }
            const itemSwap: ItemSwap = {
                currentItem1: data.activePlayer.inventory[0],
                currentItem2: data.activePlayer.inventory[1],
                pickedUpItem: itemToExchange,
            };
            this.gameService
                .openDialog({
                    title: DialogTitle.ItemExchange,
                    messages: [`Quel objet voulez échangé pour celui-ci: ${itemToExchange?.name}`],
                    options: [],
                    confirm: false,
                    itemSwap,
                })
                .subscribe(() => {
                    let newItem = itemSwap.pickedUpItem.id;
                    for (let i = 0; i < data.activePlayer.inventory.length; i++) {
                        if (data.activePlayer.inventory[i] !== oldInventory[i]) {
                            newItem = data.activePlayer.inventory[i].id;
                            break;
                        }
                    }
                    if (newItem) {
                        this.playerInventoryService.updatePlayerAfterSwap(data.activePlayer, newItem, itemSwap.pickedUpItem);
                        this.socketCommunicationService.send('endItemSwitch');
                    } else {
                        this.playerInventoryService.itemToPlace = itemSwap.pickedUpItem.id;
                        this.socketCommunicationService.send('inventoryChange', data.activePlayer);
                        this.socketCommunicationService.send('endItemSwitch');
                    }
                });
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
        // might impact tests
        if (this.activePlayer.attributes.actionPoints === 0) {
            this.activePlayer.attributes.actionPoints = 1;
        } else {
            this.activePlayer.attributes.actionPoints = this.activePlayer.attributes.maxActionPoints;
        }
        this.socketCommunicationService.send('startTurn');
    }

    onPlayerFell() {
        this.gameService
            .openDialog({
                title: DialogTitle.EndTurn,
                messages: [DialogMessages.Fell],
                confirm: false,
                options: [DialogOptions.Close],
                itemSwap: null,
            })
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
                itemSwap: null,
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
                itemSwap: null,
            })
            .subscribe((result) => {
                if (result === DialogResult.Close) {
                    this.socketCommunicationService.disconnect();
                    this.router.navigate(['/home']);
                }
            });
    }

    onEndTurn() {
        if (this.navigationService.isOnWall(this.activePlayer)) {
            this.navigationService.movePlayerFromWall(this.activePlayer);
            // will have to call displaySpawnPoints from game
        } else if (this.activePlayer.inventory.find((object) => object.id === ObjectType.Trident)) {
            if (this.activePlayer.attributes.actionPoints === 1) {
                this.activePlayer.attributes.actionPoints += 1;
                this.activePlayer.attributes.maxActionPoints = 2;
                this.socketCommunicationService.send('inventoryChange', this.activePlayer);
            }
        }
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
