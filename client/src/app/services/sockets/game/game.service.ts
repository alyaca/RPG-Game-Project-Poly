import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import {
    DialogMessages,
    DialogOptions,
    DialogResult,
    DialogTitle,
    MAX_PLAYER_LARGE_MAP,
    MAX_PLAYER_MEDIUM_MAP,
    MAX_PLAYER_SMALL_MAP,
    SIZE_LARGE_MAP,
    SIZE_MEDIUM_MAP,
    SIZE_SMALL_MAP,
} from '@app/constants';
import { DialogData } from '@app/interfaces/dialog-data';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Game } from '@common/game';
import { Player } from '@common/player';
import { Room } from '@common/room';

@Injectable({
    providedIn: 'root',
})
export class GameService {
    roomId: string;
    isRoomLocked: boolean;
    isJoined: boolean = false;
    selectedGame: Game;
    isActionDoorSelected: boolean = false;
    isActionCombatSelected: boolean = false;

    constructor(
        private socketCommunicationService: SocketCommunicationService,
        private dialog: MatDialog,
        private router: Router,
    ) {}

    setRoomId(room: string) {
        this.roomId = room;
    }

    joinRoom(roomCode: string) {
        this.socketCommunicationService.send('joinRoom', roomCode);

        this.socketCommunicationService.on('joinedRoom', (roomInfo: Room) => {
            this.isJoined = true;
            this.roomId = roomInfo.roomId;
            this.selectedGame = roomInfo.gameMap;
        });
    }

    getPlayerNumber(height: number): number {
        switch (height) {
            case SIZE_SMALL_MAP:
                return MAX_PLAYER_SMALL_MAP;
            case SIZE_MEDIUM_MAP:
                return MAX_PLAYER_MEDIUM_MAP;
            case SIZE_LARGE_MAP:
                return MAX_PLAYER_LARGE_MAP;
            default:
                throw new Error('Nombre de joueur invalide');
        }
    }

    openDialog(dialogData: DialogData) {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: dialogData,
        });
        return dialogRef.afterClosed();
    }

    onAdminQuit(message: string) {
        this.openDialog({ title: DialogTitle.GameCanceled, messages: [message], confirm: false, options: [DialogOptions.Close] }).subscribe(
            (result) => {
                if (result === DialogResult.Close) {
                    this.router.navigate(['/home']);
                }
            },
        );
    }

    onRoomDeleted() {
        this.socketCommunicationService.once('roomDeleted', (message: string) => {
            this.onAdminQuit(message);
        });
    }

    onKickPlayer() {
        this.socketCommunicationService.on('kickPlayer', () => {
            this.onPlayerKickedOut();
        });
    }

    onPlayerQuit(roomId: string) {
        this.openDialog({
            title: DialogTitle.QuitGame,
            messages: [DialogMessages.QuitGame],
            options: [DialogOptions.Quit, DialogOptions.Stay],
            confirm: true,
        }).subscribe((result) => {
            if (result === DialogResult.Left) {
                this.socketCommunicationService.send('leaveRoom', roomId);
            }
        });
    }

    onPlayerKickedOut() {
        this.openDialog({
            title: DialogTitle.KickedOut,
            messages: [DialogMessages.KickedOut],
            options: [DialogOptions.Close],
            confirm: false,
        }).subscribe((result) => {
            if (result === DialogResult.Close) {
                this.router.navigate(['/join-game']);
            }
        });
    }

    onLeftRoom() {
        this.socketCommunicationService.on('leftRoom', (isAdmin) => {
            if (isAdmin) {
                this.router.navigate(['/game-creation']);
            } else {
                this.router.navigate(['/home']);
            }
        });
    }

    hasActionPoints(player: Player) {
        if (player) {
            return player.attributes.actionPoints > 0;
        }
        return false;
    }
}
