import { Injectable } from '@angular/core';
import { Player } from '@common/player';
import { DiceComponent } from '@app/components/dice/dice.component';
import { COMBAT_TURN_LENGTH, SHORT_COMBAT_TURN_LENGTH, EVADE_SUCCES_RATE, DISPLAY_TEXT_DELAY } from '@app/constants';

export type Roles = {
    [key: string]: {
        attacker: Player;
        defender: Player;
        activeDice: DiceComponent;
        inactiveDice: DiceComponent;
    };
};

@Injectable({
    providedIn: 'root',
})
export class CombatLogicService {
    isPlayer1Damaged: boolean = false;
    isPlayer2Damaged: boolean = false;
    statValue1: number = 0;
    statValue2: number = 0;

    displayText: string = '';
    isGameOngoing: boolean = true;

    currPlayerNum: string;

    evasionsArray1: number[];
    evasionsArray2: number[];
    playerStat1: string;
    playerStat2: string;
    roles: Roles;
    isDraw: boolean;

    initCombat(player1: Player, player2: Player) {
        this.isGameOngoing = true;
        this.isDraw = false;
        this.resetPlayerHp(player1, player2);
        this.evasionsArray1 = new Array(2).fill(1);
        this.evasionsArray2 = new Array(2).fill(1);
        this.currPlayerNum = this.determineStartingPlayer(player1, player2);

        this.playerStat1 =
            this.currPlayerNum === 'player1turn' ? 'Attaque D' + player1.attributes.atkDiceMax : 'Défense D' + player1.attributes.defDiceMax;
        this.playerStat2 =
            this.currPlayerNum === 'player1turn' ? 'Défense D' + player2.attributes.defDiceMax : 'Attaque D' + player2.attributes.atkDiceMax;
    }

    resetPlayerHp(player1: Player, player2: Player) {
        player1.attributes.currentHp = player1.attributes.totalHp;
        player2.attributes.currentHp = player2.attributes.totalHp;
    }

    determineStartingPlayer(player1: Player, player2: Player): string {
        return player1.attributes.speed >= player2.attributes.speed ? 'player1turn' : 'player2turn';
    }

    dealDamage(defender: Player, isDefenderPlayer1: boolean) {
        defender.attributes.currentHp = Math.max(0, defender.attributes.currentHp - 1);

        this.isPlayer1Damaged = isDefenderPlayer1;
        this.isPlayer2Damaged = !isDefenderPlayer1;
    }

    processAttack(roles: Roles, currPlayerNum: string, player1: Player, player2: Player) {
        const { attacker, defender, activeDice, inactiveDice } = roles[currPlayerNum];
        const isDefenderPlayer1 = currPlayerNum === 'player1turn';

        this.statValue2 =
            currPlayerNum === 'player1turn' ? activeDice.value + player1.attributes.attack : inactiveDice.value + player1.attributes.defense;
        this.statValue1 =
            currPlayerNum === 'player2turn' ? activeDice.value + player2.attributes.attack : inactiveDice.value + player2.attributes.defense;

        if (activeDice.value + attacker.attributes.attack > inactiveDice.value + defender.attributes.defense) {
            this.dealDamage(defender, isDefenderPlayer1);
            this.setDisplayText('attaque réussie de ' + attacker.name);
        } else {
            this.setDisplayText('attaque échouée de ' + attacker.name);
        }
    }

    determineTimerLength(evasions: number[], currPlayerNum: string): number {
        return evasions.length === 0 && currPlayerNum !== 'player1turn' ? SHORT_COMBAT_TURN_LENGTH : COMBAT_TURN_LENGTH;
    }

    setDisplayText(text: string) {
        this.displayText = '';
        setTimeout(() => {
            this.displayText = text;
        }, DISPLAY_TEXT_DELAY);
    }

    switchTurn(player1: Player, player2: Player) {
        this.currPlayerNum = this.currPlayerNum === 'player1turn' ? 'player2turn' : 'player1turn';
        const nextPlayer = this.currPlayerNum === 'player1turn' ? player1.name : player2.name;
        this.setDisplayText("C'est le tour de " + nextPlayer);
    }

    attemptEvade() {
        if (this.evasionsArray1.length === 0) {
            this.setDisplayText("Évasion pas possible, vous n'avez plus d'évasions restantes");
            return;
        }
        this.evasionsArray1.pop();
        if (Math.random() < EVADE_SUCCES_RATE) {
            this.isDraw = true;
            this.setDisplayText('Évasion réussie');
        } else {
            this.setDisplayText('Évasion échouée');
        }
    }

    checkIfDuelOver(player1: Player, player2: Player): string {
        if (player2.attributes.currentHp === 0) {
            this.setDisplayText('Vous avez gagné le duel');
            return 'Victoire';
        } else if (player1.attributes.currentHp === 0) {
            this.setDisplayText('Vous avez perdu le duel');
            return 'Défaite';
        } else if (this.isDraw) {
            this.setDisplayText('Évasion réussie');
            return 'Partie nulle';
        }
        return '';
    }

    processTurnDialog(player1: Player, player2: Player) {
        this.isPlayer1Damaged = false;
        this.isPlayer2Damaged = false;

        this.playerStat1 = this.playerStat1.includes('Attaque')
            ? 'Défense D' + player1.attributes.defDiceMax
            : 'Attaque D' + player1.attributes.atkDiceMax;
        this.playerStat2 = this.playerStat2.includes('Attaque')
            ? 'Défense D' + player2.attributes.defDiceMax
            : 'Attaque D' + player2.attributes.atkDiceMax;
    }
}
