import { Injectable } from '@angular/core';
import { ATTACK_TIME } from '@app/constants';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { Player } from '@common/player';
import { BehaviorSubject } from 'rxjs';
import { SocketCommunicationService } from '../sockets/socket-communication/socket-communication.service';

@Injectable({
    providedIn: 'root',
})
export class CombatService {
    private attackerSource = new BehaviorSubject<Player>(mockLobbyPlayers[0]);
    private defenderSource = new BehaviorSubject<Player>(mockLobbyPlayers[1]);
    private combatTurnTimeSource = new BehaviorSubject<number>(ATTACK_TIME);
    activePlayer: Player;
    opponent: Player;
    attacker$ = this.attackerSource.asObservable();
    defender$ = this.defenderSource.asObservable();
    combatTurnTime$ = this.combatTurnTimeSource.asObservable();

    combatStatus: string;
    turnMessage: string;

    constructor(private socketCommunicationService: SocketCommunicationService) {}

    initializeCombat(player1: Player, player2: Player) {
        this.activePlayer = player1;
        this.opponent = player2;
        this.attackerSource.next(player1);
        this.defenderSource.next(player2);
    }

    initializeAttacker(player1: Player, player2: Player) {
        const [attacker, defender] = player1.attributes.speed < player2.attributes.speed ? [player2, player1] : [player1, player2];
        this.attackerSource.next(attacker);
        this.defenderSource.next(defender);
    }

    changeTurn() {
        const currentAttacker = this.attackerSource.value;
        const currentDefender = this.defenderSource.value;
        this.attackerSource.next(currentDefender);
        this.defenderSource.next(currentAttacker);
    }

    initSocketListeners() {
        this.socketCommunicationService.on('combatTime', (timeRemaining: number) => {
            this.combatTurnTimeSource.next(timeRemaining);
        });

        this.socketCommunicationService.on('combatTurnEnded', () => {
            this.changeTurn();
        });

        this.socketCommunicationService.on('attackSuccess', (player: Player) => {
            this.defenderSource.value.attributes.currentHp -= 1;
            this.combatStatus = player.name + ' a réussi son attaque.';
        });

        this.socketCommunicationService.on('attackFail', (player: Player) => {
            this.combatStatus = player.name + ' a échoué son attaque.';
        });

        this.socketCommunicationService.on('playerDead', (player: Player) => {
            this.combatStatus = player.name + ' a perdu le combat.';
        });

        this.socketCommunicationService.on('evasionSuccess', (player: Player) => {
            this.combatStatus = player.name + " a réussi à s'évader";
        });

        this.socketCommunicationService.on(
            'attackValues',
            (data: { activePlayer: { player: Player; attackValue: number }; defensePlayer: { player: Player; defenseValue: number } }) => {
                const attacker = this.attackerSource.value;
                const defender = this.defenderSource.value;

                attacker.attributes.attack = data.activePlayer.attackValue;
                defender.attributes.defense = data.defensePlayer.defenseValue;
                this.attackerSource.next(attacker);
                this.defenderSource.next(defender);
            },
        );
    }
}
