import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CombatStatsBarComponent } from '@app/components/combat-stats-bar/combat-stats-bar.component';
import { DiceComponent } from '@app/components/dice/dice.component';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { COMBAT_TURN_LENGTH } from '@app/constants';
import { CombatLogicService } from '@app/services/combat-logic/combat-logic.service';
import { CombatService } from '@app/services/combat/combat.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-combat-modal',
    standalone: true,
    imports: [TimerComponent, DiceComponent, CommonModule, TemporaryDialogComponent, CombatStatsBarComponent],
    templateUrl: './combat-modal.component.html',
    styleUrl: './combat-modal.component.scss',
})
export class CombatModalComponent implements OnInit, OnDestroy {
    @Input() isInCombat = false;
    @Output() closeModalEvent = new EventEmitter<void>();
    @ViewChild('dice1') dice1!: DiceComponent;
    @ViewChild('dice2') dice2!: DiceComponent;
    activePlayer: Player;
    opponent: Player;
    attacker: Player;
    defender: Player;

    totalTime: number = COMBAT_TURN_LENGTH;
    timeRemaining: number = COMBAT_TURN_LENGTH;
    combatTurnTime: number;
    combatStatus: string = '';
    private subscription: Subscription = new Subscription();

    constructor(
        public combatService2: CombatLogicService,
        public combatService: CombatService,
        public socketCommunicationService: SocketCommunicationService,
    ) {}

    ngOnInit() {
        this.activePlayer = this.combatService.activePlayer;
        this.opponent = this.combatService.opponent;
        this.attacker = this.combatService.attacker;
        this.defender = this.combatService.defender;

        this.subscription.add(
            this.combatService.combatTurnTime$.subscribe((timeRemaining) => {
                this.combatTurnTime = timeRemaining;
            }),
        );

        this.combatService.initSocketListeners();
    }

    ngOnDestroy() {
        this.combatService.removeListeners();
    }
    // ngAfterViewInit() {
    //     this.combatService2.roles = {
    //         player1turn: { attacker: this.player2, defender: this.player1, activeDice: this.dice1, inactiveDice: this.dice2 },
    //         player2turn: { attacker: this.player1, defender: this.player2, activeDice: this.dice2, inactiveDice: this.dice1 },
    //     };
    // }

    closeModal() {
        this.combatService2.setDisplayText('');
        this.combatService.resetPlayerHp(this.combatService.activePlayer, this.combatService.opponent);
        this.isInCombat = this.combatService.isInCombat;
        this.closeModalEvent.emit();
    }

    triggerAttack() {
        this.socketCommunicationService.send('attackPlayer');
    }

    triggerEvade() {
        this.socketCommunicationService.send('evadeCombat', this.attacker);
        // this.combatService2.attemptEvade();
    }
}
