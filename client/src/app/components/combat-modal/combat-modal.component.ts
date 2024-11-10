import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CombatStatsBarComponent } from '@app/components/combat-stats-bar/combat-stats-bar.component';
import { DiceComponent } from '@app/components/dice/dice.component';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { COMBAT_TURN_LENGTH } from '@app/constants';
import { CombatLogicService } from '@app/services/combat-logic/combat-logic.service';
import { CombatService } from '@app/services/combat/combat.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';

@Component({
    selector: 'app-combat-modal',
    standalone: true,
    imports: [TimerComponent, DiceComponent, CommonModule, TemporaryDialogComponent, CombatStatsBarComponent],
    templateUrl: './combat-modal.component.html',
    styleUrl: './combat-modal.component.scss',
})
export class CombatModalComponent implements OnInit, AfterViewInit {
    @Input() isInCombat = false;
    @Output() closeModalEvent = new EventEmitter<void>();
    @ViewChild('dice1') dice1!: DiceComponent;
    @ViewChild('dice2') dice2!: DiceComponent;
    @ViewChild('timer') timerComponent!: TimerComponent;
    @ViewChild('temporaryDialog') temporaryDialogComponent!: TemporaryDialogComponent;

    player1: Player;
    player2: Player;
    activePlayer: Player;
    defensePlayer: Player;

    totalTime: number = COMBAT_TURN_LENGTH;
    timeRemaining: number = COMBAT_TURN_LENGTH;

    combatTurnTime: number;
    combatStatus: string;

    constructor(
        public combatService2: CombatLogicService,
        private combatService: CombatService,
        public socketCommunicationService: SocketCommunicationService,
    ) {}

    ngOnInit() {
        this.combatStatus = '';
        this.player1 = this.combatService.player1;
        this.player2 = this.combatService.player2;
        this.activePlayer = this.player1;
        this.defensePlayer = this.player2;
        this.socketCommunicationService.on('combatTime', (timeRemaining: number) => {
            if (timeRemaining < 0) return;
            this.combatTurnTime = timeRemaining;
        });

        this.socketCommunicationService.on('combatTurnEnded', () => {
            [this.activePlayer, this.defensePlayer] = [this.defensePlayer, this.activePlayer];
        });

        this.socketCommunicationService.on(
            'attackValues',
            (data: { activePlayer: { player: Player; attackValue: number }; defensePlayer: { player: Player; defenseValue: number } }) => {
                this.activePlayer.attributes.attack = data.activePlayer.attackValue;
                this.defensePlayer.attributes.defense = data.defensePlayer.defenseValue;
            },
        );

        this.socketCommunicationService.on('attackSuccess', () => {
            this.defensePlayer.attributes.currentHp -= 1;
            this.combatStatus = this.activePlayer.name + ' a réussi son attaque';
        });

        this.socketCommunicationService.on('attackFail', () => {
            this.activePlayer.attributes.currentHp -= 1;
            this.combatStatus = this.activePlayer.name + ' a raté son attaque';
        });

        this.socketCommunicationService.on('playerDead', (player: Player) => {
            this.combatStatus = player.name + ' est mort';
        });

        this.socketCommunicationService.on('evasionSuccess', (player: Player) => {
            this.combatStatus = player.name + " a réussi à s'évader";
        });
    }

    determineStats(player: Player): number {
        if (player.id === this.activePlayer.id) {
            return player.attributes.attack;
        } else if (player.id === this.defensePlayer.id) {
            return player.attributes.defense;
        }
        return 0;
    }

    ngAfterViewInit() {
        this.combatService2.roles = {
            player1turn: { attacker: this.player2, defender: this.player1, activeDice: this.dice1, inactiveDice: this.dice2 },
            player2turn: { attacker: this.player1, defender: this.player2, activeDice: this.dice2, inactiveDice: this.dice1 },
        };
    }

    closeModal() {
        this.combatService2.setDisplayText('');
        this.combatService2.resetPlayerHp(this.player1, this.player2);
        this.isInCombat = false;
        this.closeModalEvent.emit();
    }

    triggerAttack() {
        this.socketCommunicationService.send('attackPlayer');
    }

    triggerEvade() {
        this.combatService2.attemptEvade();
    }
}
