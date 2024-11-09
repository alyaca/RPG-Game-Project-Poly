import { Injectable } from '@angular/core';
import { ATTACK_TIME } from '@app/constants';
import { Player } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { SocketCommunicationService } from '../sockets/socket-communication/socket-communication.service';

@Injectable({
    providedIn: 'root',
})
export class CombatService {
    private combatTurnTimeSource = new BehaviorSubject<number>(ATTACK_TIME);
    combatTurnTime$ = this.combatTurnTimeSource.asObservable();

    activePlayer: Player;
    opponent: Player;
    attacker: Player;
    defender: Player;
    combatStatus: string;
    turnMessage: string;
    activePlayerResult: number = 0;
    opponentResult: number = 0;

    constructor(private socketCommunicationService: SocketCommunicationService) {}

    initializeCombat(player1: Player, player2: Player, isPlayer1Active: boolean) {
        this.activePlayer = isPlayer1Active ? player1 : player2;
        this.opponent = isPlayer1Active ? player2 : player1;
        this.attacker = player1;
        this.defender = player2;
        this.turnMessage = this.isCurrentTurn() ? "C'est votre tour" : "C'est le tour de votre adversaire";
    }

    initSocketListeners() {
        this.socketCommunicationService.on('combatTime', (timeRemaining: number) => {
            this.combatTurnTimeSource.next(timeRemaining);
        });

        this.socketCommunicationService.on('attackValues', (data: { attackValue: number; defenseValue: number }) => {
            this.attacker.attributes.attack = data.attackValue;
            this.defender.attributes.defense = data.defenseValue;
        });

        this.socketCommunicationService.on('attackSuccess', (player: Player) => {
            if (this.isAttacker(this.activePlayer)) {
                this.opponent.attributes.currentHp--;
            } else {
                this.activePlayer.attributes.currentHp--;
            }
            this.combatStatus = player.name + ' a réussi son attaque.';
        });

        this.socketCommunicationService.on('attackFail', (player: Player) => {
            this.combatStatus = player.name + ' a échoué son attaque.';
        });

        this.socketCommunicationService.on('evasionSuccess', (player: Player) => {
            this.combatStatus = player.name + " a réussi à s'évader";
        });

        this.socketCommunicationService.on('combatTurnEnded', (data: { attacker: Player; defender: Player }) => {
            this.activePlayerResult = this.determineStats(this.activePlayer);
            this.opponentResult = this.determineStats(this.opponent);
            this.attacker = data.attacker;
            this.defender = data.defender;
            this.turnMessage = this.isCurrentTurn() ? "C'est votre tour" : "C'est le tour de votre adversaire";
        });

        this.socketCommunicationService.on('playerDead', (player: Player) => {
            this.combatStatus = player.name + ' a perdu le combat.';
        });
    }

    resetPlayerHp(player1: Player, player2: Player) {
        player1.attributes.currentHp = player1.attributes.totalHp;
        player2.attributes.currentHp = player2.attributes.totalHp;
    }

    determineStats(player: Player) {
        return this.isAttacker(player) ? this.attacker.attributes.attack : this.defender.attributes.defense;
    }

    isAttacker(player: Player) {
        return this.attacker && player.id === this.attacker.id;
    }

    isCurrentTurn() {
        return this.socketCommunicationService.socket.id === this.attacker.id;
    }
}
