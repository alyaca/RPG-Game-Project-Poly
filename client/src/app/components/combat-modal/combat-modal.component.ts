import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CombatStatsBarComponent } from '@app/components/combat-stats-bar/combat-stats-bar.component';
import { DiceComponent } from '@app/components/dice/dice.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import {
    COMBAT_TURN_LENGTH,
    EXIT_COMBAT_DELAY,
    INIT_DISPLAY_DELAY,
    LONG_TEMP_DIALOG_DURATION,
    TEMP_DIALOG_DURATION,
    TURN_DIALOG_DELAY,
} from '@app/constants';
import { CombatLogicService } from '@app/services/combat-logic/combat-logic.service';
import { CombatService } from '@app/services/combat/combat.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';

@Component({
    selector: 'app-combat-modal',
    standalone: true,
    imports: [TimerComponent, DiceComponent, CommonModule, SimpleDialogComponent, TemporaryDialogComponent, CombatStatsBarComponent],
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

        this.socketCommunicationService.on('CombatTurnEnded', (activePlayer: Player) => {
            if (activePlayer.id === this.player1.id) {
                this.activePlayer = this.player1;
                this.defensePlayer = this.player2;
            } else {
                this.activePlayer = this.player2;
                this.defensePlayer = this.player1;
            }
            //console.log('turn ended, turn of player: ', activePlayer.name);
        });

        this.socketCommunicationService.on(
            'attackValues',
            (data: { activePlayer: { player: Player; attackValue: number }; defensePlayer: { player: Player; defenseValue: number } }) => {
                this.activePlayer.attributes.attack = data.activePlayer.attackValue;
                this.defensePlayer.attributes.defense = data.defensePlayer.defenseValue;
                //<button class="temp-attack" (click)="attackPlayer()">Attack</button>
                console.log('att : ' + data.activePlayer.attackValue, 'def : ' + data.defensePlayer.defenseValue);
            },
        );

        this.socketCommunicationService.on('attackSuccess', (player: Player) => {
            //On recois le defensePlayer ou cas ou il gagne le tour (pas le combat)
            this.defensePlayer.attributes.currentHp -= 1;
            this.combatStatus = this.activePlayer.name + ' a réussi son attaque';
            //console.log('gagnat de tours : ' + data.player.name);
        });

        this.socketCommunicationService.on('attackFail', (player: Player) => {
            //On recois le activePlayer (attaquant) ou cas ou il gagne le tour (pas le combat
            this.activePlayer.attributes.currentHp -= 1;
            this.combatStatus = this.activePlayer.name + ' a raté son attaque';
            //console.log('gagnat de tour : ' + data.player.name);
        });

        this.socketCommunicationService.on('playerDead', (player: Player) => {
            //on recois le perdant du combat (pas le tour)
            this.activePlayer.victories++;
            this.combatStatus = player.name + ' est mort';
            console.log('combat ended, ', player, ' is dead');
        });

        this.socketCommunicationService.on('evasionSuccess', (player: Player) => {
            //TODO : implementer dans le front
            this.combatStatus = player.name + " a réussi à s'évader";
            console.log('evasion success for ', player.name);
        });
    }
    //a placer dans une service:
    determineStats(player: Player): number {
        if (player.id === this.activePlayer.id) {
            return player.attributes.attack;
        } else if (player.id === this.defensePlayer.id) {
            return player.attributes.defense;
        }
        return 0;
    }

    initializeDisplay() {
        setTimeout(() => {
            const message = this.combatService2.currPlayerNum === 'player1turn' ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message, TEMP_DIALOG_DURATION);
        }, INIT_DISPLAY_DELAY);
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

    endGameIfNeeded() {
        const finalResult: string = this.combatService2.checkIfDuelOver(this.player1, this.player2);
        if (finalResult) {
            this.triggerTempDialog(finalResult, LONG_TEMP_DIALOG_DURATION);
            this.combatService2.isGameOngoing = false;
            this.timerComponent.totalTime = 3;
            this.timerComponent.resetTimer();
            setTimeout(() => {
                this.closeModal();
            }, EXIT_COMBAT_DELAY);
        }
    }

    triggerTurnDialog() {
        setTimeout(() => {
            this.combatService2.processTurnDialog(this.player1, this.player2);
            const message = this.combatService2.currPlayerNum === 'player1turn' ? 'Votre tour' : "Tour de l'adversaire";
            this.triggerTempDialog(message, TEMP_DIALOG_DURATION);
        }, TURN_DIALOG_DELAY);
    }

    attack() {
        this.combatService2.processAttack(this.combatService2.roles, this.combatService2.currPlayerNum, this.player1, this.player2);
        this.timerComponent.resetTimer();
        this.triggerTurnDialog();
        this.endGameIfNeeded();
    }

    triggerAttack() {
        this.socketCommunicationService.send('attackPlayer');
        /*
        this.totalTime = this.combatService2.determineTimerLength(this.combatService2.evasionsArray1, this.combatService2.currPlayerNum);
        this.timeRemaining = this.totalTime;
        if (!this.combatService2.isGameOngoing || this.combatService2.attackInProgress) {
            return;
        }
        this.combatService2.attackInProgress = true;

        this.combatService2.switchTurn();
        const { attacker, defender, activeDice, inactiveDice } = this.combatService2.roles[this.combatService2.currPlayerNum];

        activeDice.rollDice(attacker.attributes.atkDiceMax);

        setTimeout(() => {
            inactiveDice.rollDice(defender.attributes.defDiceMax);
        }, INACTIVE_DICE_DELAY);

        setTimeout(() => {
            this.attack();
            this.combatService2.attackInProgress = false;
        }, ATTACK_DELAY);
        */
    }

    triggerEvade() {
        this.combatService2.attemptEvade();
        this.endGameIfNeeded();
    }

    triggerTempDialog(message: string, duration: number) {
        if (this.combatService2.isGameOngoing) {
            this.temporaryDialogComponent.show(message, duration);
        }
    }

    onTimerFinished() {
        if (!this.combatService2.attackInProgress) {
            this.triggerAttack();
        }
    }
}
