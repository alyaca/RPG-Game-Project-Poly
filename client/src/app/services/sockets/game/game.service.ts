import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
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
import { TempDialogData } from '@app/interfaces/temp-dialog-data';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Game } from '@common/interfaces/game';
import { Player, Position } from '@common/interfaces/player';
import { Room } from '@common/interfaces/room';
import { PathRoute } from '@common/interfaces/route';
import { ClientToServerEvent, ServerToClientEvent } from '@common/socket.events';

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
    playersTarget: Player[];
    doorsTarget: Position[];

    constructor(
        private socketCommunicationService: SocketCommunicationService,
        private dialog: MatDialog,
        private router: Router,
    ) {}

    setRoomId(room: string) {
        this.roomId = room;
    }

    joinRoom(roomCode: string) {
        this.socketCommunicationService.send(ClientToServerEvent.JoinRoom, roomCode);

        this.socketCommunicationService.on(ServerToClientEvent.JoinedRoom, (roomInfo: Room) => {
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

    openTempDialog(dialogData: TempDialogData) {
        const dialogRef = this.dialog.open(TemporaryDialogComponent, {
            disableClose: true,
            data: dialogData,
        });
        return dialogRef.afterClosed();
    }

    onAdminQuit(message: string) {
        this.openDialog({
            title: DialogTitle.GameCanceled,
            messages: [message],
            confirm: false,
            options: [DialogOptions.Close],
        }).subscribe((result) => {
            if (result === DialogResult.Close) {
                this.router.navigate([PathRoute.HOME]);
            }
        });
    }

    onRoomDeleted() {
        this.socketCommunicationService.once('roomDeleted', (message: string) => {
            this.onAdminQuit(message);
        });
    }

    onKickPlayer() {
        this.socketCommunicationService.once('kickPlayer', () => {
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
            if (result.action === DialogResult.Left) {
                this.socketCommunicationService.send(ClientToServerEvent.LeaveRoom, roomId);
            }
        });
    }

    onQuitPostGameLobby(roomId: string) {
        this.openDialog({
            title: DialogTitle.QuitPostGameLobby,
            messages: [DialogMessages.QuitPostGameLobby],
            options: [DialogOptions.Quit, DialogOptions.Stay],
            confirm: true,
        }).subscribe((result) => {
            if (result.action === DialogResult.Left) {
                this.router.navigate([PathRoute.HOME]);
                this.socketCommunicationService.send(ClientToServerEvent.LeaveRoom, roomId);
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
            if (result.action === DialogResult.Close) {
                this.router.navigate([PathRoute.HOME]);
            }
        });
    }

    onLeftRoom() {
        this.socketCommunicationService.on(ServerToClientEvent.LeftRoom, (isAdmin) => {
            if (isAdmin) {
                this.router.navigate([PathRoute.CREATE]);
            } else {
                this.router.navigate([PathRoute.HOME]);
            }
        });
    }

    hasActionPoints(player: Player) {
        return player?.attributes.actionPoints > 0;
    }

    isActionSelected() {
        return this.isActionDoorSelected || this.isActionCombatSelected;
    }

    isTarget(row: number, col: number) {
        return this.isTargetDoor(row, col) || this.isTargetPlayer(row, col);
    }

    isTargetDoor(row: number, col: number) {
        return this.isActionDoorSelected ? this.doorsTarget.some((tile) => tile.x === row && tile.y === col) : false;
    }

    isTargetPlayer(row: number, col: number) {
        return this.isActionCombatSelected ? this.playersTarget.some((tile) => tile.position.x === row && tile.position.y === col) : false;
    }
}
