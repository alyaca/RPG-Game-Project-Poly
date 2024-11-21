import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CombatStatsBarComponent } from '@app/components/combat-stats-bar/combat-stats-bar.component';
import { DiceComponent } from '@app/components/dice/dice.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { COMBAT_TURN_LENGTH } from '@app/constants';
import { CombatService } from '@app/services/combat/combat.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-combat-modal',
    standalone: true,
    imports: [TimerComponent, DiceComponent, CommonModule, CombatStatsBarComponent],
    templateUrl: './combat-modal.component.html',
    styleUrl: './combat-modal.component.scss',
})
export class CombatModalComponent implements OnInit, OnDestroy {
    @Input() isInCombat = false;
    @ViewChild('dice1') dice1!: DiceComponent;
    @ViewChild('dice2') dice2!: DiceComponent;
    activePlayer: Player;
    opponent: Player;

    totalTime: number = COMBAT_TURN_LENGTH;
    timeRemaining: number = COMBAT_TURN_LENGTH;
    combatTurnTime: number;
    combatStatus: string = '';
    private subscription: Subscription = new Subscription();

    constructor(
        public combatService: CombatService,
        public socketCommunicationService: SocketCommunicationService,
    ) {}

    ngOnInit() {
        this.activePlayer = this.combatService.activePlayer;
        this.opponent = this.combatService.opponent;

        this.subscription.add(
            this.combatService.combatTurnTime$.subscribe((timeRemaining) => {
                this.combatTurnTime = timeRemaining;
            }),
        );
        this.combatService.initSocketListeners();
        this.dice1.rollDice();
        this.dice2.rollDice();
    }

    ngOnDestroy() {
        this.combatService.removeListeners();
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    closeModal() {
        this.combatService.resetPlayerHp(this.combatService.activePlayer, this.combatService.opponent);
        this.isInCombat = this.combatService.isInCombat;
    }

    triggerAttack() {
        this.socketCommunicationService.send('attackPlayer');
    }

    triggerEvade() {
        this.socketCommunicationService.send('evadeCombat', this.combatService.attacker);
    }
}
