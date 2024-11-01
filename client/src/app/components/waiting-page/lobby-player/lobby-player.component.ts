import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { Status } from '@app/interfaces/player-object';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';
@Component({
    selector: 'app-lobby-player',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './lobby-player.component.html',
    styleUrl: './lobby-player.component.scss',
})
export class LobbyPlayerComponent {
    @Input() lobbyPlayer: Player;
    @Input() isPlayerAdmin: boolean;

    constructor(
        private dialog: MatDialog,
        private socketCommunicationService: SocketCommunicationService,
    ) {}

    isAdmin() {
        return this.lobbyPlayer.status === Status.Admin;
    }

    openConfirmationDialog(title: string, messages: string[], options: string[], confirm: boolean) {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title,
                messages,
                options,
                confirm,
            },
        });
        return dialogRef.afterClosed();
    }

    kickOutPlayer() {
        this.openConfirmationDialog(
            'Supprimer un joueur',
            ['Êtes-vous certain de vouloir supprimer le joueur?'],
            ['Supprimer', 'Annuler'],
            true,
        ).subscribe((result) => {
            if (result === 'left') {
                this.socketCommunicationService.send('kickPlayer', this.lobbyPlayer.id);
            }
        });
    }
}
