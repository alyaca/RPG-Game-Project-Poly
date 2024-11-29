import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { Status } from '@app/interfaces/player-object';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Behavior, Player } from '@common/interfaces/player';
import { ClientToServerEvent } from '@common/socket.events';
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
    status = Status;
    behavior = Behavior;
    constructor(
        private dialog: MatDialog,
        private socketCommunicationService: SocketCommunicationService,
    ) {}

    kickOutPlayer() {
        const dialogRef = this.dialog.open(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Exclure un joueur',
                messages: ['Êtes-vous certain de vouloir exclure le joueur?'],
                options: ['Annuler', 'Exclure'],
                confirm: true,
            },
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result.action === 'right') {
                if (this.lobbyPlayer.status === Status.Bot) {
                    this.socketCommunicationService.send(ClientToServerEvent.KickBot, this.lobbyPlayer.id);
                } else {
                    this.socketCommunicationService.send(ClientToServerEvent.KickPlayer, this.lobbyPlayer.id);
                }
            }
        });
    }
}
