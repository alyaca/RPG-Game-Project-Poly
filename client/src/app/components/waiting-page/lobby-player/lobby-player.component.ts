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
    public Status = Status;
    constructor(
        private dialog: MatDialog,
        private socketCommunicationService: SocketCommunicationService,
    ) {}

    getPlayerClass(): string {
        if(this.lobbyPlayer.status === Status.Admin){
            return 'admin';
        }
        else if(this.lobbyPlayer.status === Status.Bot){
            return 'bot';
        }
        else{
            return 'player';
        }
    }

    isAdmin(){
        return this.lobbyPlayer.status === Status.Admin;
    }

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
            if (result === 'right') {
                if(this.lobbyPlayer.status === Status.Bot){
                    this.socketCommunicationService.send('kickBot', this.lobbyPlayer.id);
                }
                else{
                    this.socketCommunicationService.send('kickPlayer', this.lobbyPlayer.id);
                }
            }
        });
    }
}
