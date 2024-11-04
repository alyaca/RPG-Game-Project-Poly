import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Player } from '@common/player';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Room } from '@common/room';

@Component({
    selector: 'app-combat-stats-bar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './combat-stats-bar.component.html',
    styleUrl: './combat-stats-bar.component.scss',
})
export class CombatStatsBarComponent implements OnInit {
    @Input() playerId: string | undefined;
    @Input() player: Player;
    @Input() isOnRightSide: boolean;
    @Input() isDamaged: boolean;

    ngOnInit() {
        this.socketCommunicationService.on<Room>('mapInformation', (room: Room) => {
            const foundPlayer = room.listPlayers.find((player) => player.id === this.playerId);
            if (foundPlayer) {
                this.player = foundPlayer;
            }
        });
    }

    constructor(private socketCommunicationService: SocketCommunicationService){}
}
