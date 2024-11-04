import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { LobbyPlayerComponent } from '@app/components/waiting-page/lobby-player/lobby-player.component';
import { DialogMessages, DialogOptions, DialogResult, DialogTitle, MIN_NUMBER_PLAYER } from '@app/constants';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameListService } from '@app/services/game-list/game-list.service';
import { MapEditorService } from '@app/services/map-editor/map-editor.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Game } from '@common/game';
import { Player } from '@common/player';
import { Room } from '@common/room';

@Component({
    selector: 'app-waiting-page',
    standalone: true,
    imports: [RouterLink, CommonModule, LobbyPlayerComponent, ChatBoxComponent, FormsModule],
    templateUrl: './waiting-page.component.html',
    styleUrl: './waiting-page.component.scss',
})
export class WaitingPageComponent implements OnInit {
    accessCode: string;
    chosenGame: Game;
    isLocked: boolean = false;
    isAdmin: boolean = false;
    players: Player[];

    private router = inject(Router);
    private gameService = inject(GameService);

    constructor(
        private mapEditorService: MapEditorService,
        private gameCreationService: GameCreationService,
        private socketCommunicationService: SocketCommunicationService,
        private gameListService: GameListService,
    ) {
        this.gameListService.chosenGameSubject.subscribe((game: Game | null) => {
            if (game) {
                this.chosenGame = game;
            }
        });
        this.accessCode = this.gameService.roomId;
        this.chosenGame = this.gameService.selectedGame;
    }

    ngOnInit() {
        if (!this.accessCode || !this.chosenGame) {
            this.router.navigate(['/home']);
        }
        this.initSocketListeners();
    }

    initSocketListeners() {
        this.gameService.onRoomDeleted();
        this.gameService.onLeftRoom();
        this.gameService.onKickPlayer();
        this.socketCommunicationService.on('updatedPlayer', (room: Room) => {
            this.players = room.listPlayers;
            this.onMaxPlayers();
        });

        this.socketCommunicationService.on('isPlayerAdmin', (isPlayerAdmin: boolean) => {
            this.isAdmin = isPlayerAdmin;
        });

        this.socketCommunicationService.on<Room>('startGame', (room: Room) => {
            this.chosenGame = room.gameMap;
            this.loadMap();
            this.router.navigate(['/game-page'], { queryParams: { roomCode: this.accessCode } });
        });
    }

    isMaxPlayersReached() {
        return this.players?.length >= this.gameService.getPlayerNumber(this.chosenGame?.dimension);
    }

    onMaxPlayers() {
        this.isLocked = this.isMaxPlayersReached();
        this.onLockChange();
    }

    onLockChange() {
        this.gameService.isRoomLocked = this.isLocked;
        this.socketCommunicationService.send('changeLockRoom', this.isLocked);
    }

    handleExit(accessCode: string) {
        this.gameService.onPlayerQuit(accessCode);
    }

    loadMap() {
        this.gameCreationService.isModifiable = false;
        this.mapEditorService.setMapToEdit(this.chosenGame);
        this.gameCreationService.setSelectedSize(this.gameCreationService.convertMapDimension(this.chosenGame));
        this.gameCreationService.isNewGame = false;
        this.gameCreationService.loadedTiles = this.chosenGame.tiles;
        this.gameCreationService.loadedObjects = this.chosenGame.itemPlacement;
        this.gameCreationService.loadedMapName = this.chosenGame.name;
    }

    handleStartGame() {
        if (this.players.length < MIN_NUMBER_PLAYER) {
            this.gameService.openDialog({
                title: DialogTitle.StartGame,
                messages: [DialogMessages.NotEnoughPlayers],
                options: [DialogOptions.Close],
                confirm: false,
            });
            return;
        } else if (this.isLocked) {
            this.confirmStartGame();
        } else {
            this.gameService.openDialog({
                title: DialogTitle.StartGame,
                messages: [DialogMessages.RoomLocked],
                options: [DialogOptions.Close],
                confirm: false,
            });
        }
    }

    private confirmStartGame() {
        this.gameService
            .openDialog({
                title: DialogTitle.StartGame,
                messages: [DialogMessages.ConfirmStartGame],
                options: [DialogOptions.Cancel, DialogOptions.Confirm],
                confirm: true,
            })
            .subscribe((result) => {
                if (result === DialogResult.Right) {
                    this.isLocked = true;
                    this.socketCommunicationService.send('startGame');
                }
            });
    }
}
