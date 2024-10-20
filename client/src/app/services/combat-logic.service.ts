import { Injectable } from '@angular/core';
import { PlayerObjects } from '@app/interfaces/playerObject';
import { DiceComponent } from '@app/components/dice/dice.component';
import { COMBAT_TURN_LENGTH, EVADE_SUCCES_RATE } from '@app/constants';
// import { EVADE_SUCCES_RATE, COMBAT_TURN_LENGTH } from '@app/constants';

export type Roles = {
    [key: number]: {
        attacker: PlayerObjects;
        defender: PlayerObjects;
        activeDice: DiceComponent;
        inactiveDice: DiceComponent;
    };
}

@Injectable({
  providedIn: 'root',
})
export class CombatLogicService {
    // put into player object?
    isPlayer1Damaged: boolean = false;
    isPlayer2Damaged: boolean = false;
    statValue1: number = 0;
    statValue2: number = 0;

    displayText: string = '';
    isGameOngoing: boolean = true;

    ////

    currPlayerNum: number;

    evasionsArray1: number[];
    evasionsArray2: number[];
    // maybe i should rename these variables
    playerStat1: string;
    playerStat2: string;
    roles: Roles;
    isDraw: boolean;

    initCombat(player1: PlayerObjects, player2: PlayerObjects){
        this.isGameOngoing = true;
        this.isDraw = false;
        this.resetPlayerHp(player1, player2);
        this.evasionsArray1 = new Array(2).fill(1);
        this.evasionsArray2 = new Array(2).fill(1);
        this.currPlayerNum = this.determineStartingPlayer(player1, player2);

        this.playerStat1 =
        this.currPlayerNum === 1 ? 'Attaque D' + player1.attributes.atkDiceMax : 'Défense D' + player1.attributes.defDiceMax;
        this.playerStat2 =
        this.currPlayerNum === 1 ? 'Défense D' + player2.attributes.defDiceMax : 'Attaque' + player2.attributes.atkDiceMax;
    }

    resetPlayerHp(player1: PlayerObjects, player2: PlayerObjects) {
        player1.attributes.currentHp = player1.attributes.totalHp;
        player2.attributes.currentHp = player2.attributes.totalHp;
    }

    determineStartingPlayer(player1: PlayerObjects, player2: PlayerObjects): number {
        return player1.attributes.speed >= player2.attributes.speed ? 1 : 2;
    }
    
    dealDamage(defender: PlayerObjects, isDefenderPlayer1: boolean) {
        defender.attributes.currentHp = Math.max(0, defender.attributes.currentHp - 1);

        this.isPlayer1Damaged = isDefenderPlayer1;
        this.isPlayer2Damaged = !isDefenderPlayer1;
    }

    processAttack(roles: Roles, currPlayerNum: number, player1: PlayerObjects, player2: PlayerObjects) {
        const { attacker, defender, activeDice, inactiveDice } = roles[currPlayerNum];
        const isDefenderPlayer1 = currPlayerNum === 1;

        this.statValue2 =
            currPlayerNum === 1 ? activeDice.value + player1.attributes.attack : inactiveDice.value + player1.attributes.defense;
        this.statValue1 =
            currPlayerNum === 2 ? activeDice.value + player2.attributes.attack : inactiveDice.value + player2.attributes.defense;

        if (activeDice.value + attacker.attributes.attack > inactiveDice.value + defender.attributes.defense) {
            this.dealDamage(defender, isDefenderPlayer1);
            this.setDisplayText('attaque réussie de ' + attacker.name);
        }      
        else {
            this.setDisplayText('attaque échouée de ' + attacker.name);
        }
    }   

    determineTimerLength(evasions: number[], currPlayerNum: number): number {
        return evasions.length === 0 && currPlayerNum !== 1 ? 3 : COMBAT_TURN_LENGTH;
    }

    setDisplayText(text: string) {
        this.displayText = '';
        setTimeout(() => {
            this.displayText = text;
        }, 300);
    }

    switchTurn(player1: PlayerObjects, player2: PlayerObjects) {
        this.currPlayerNum = this.currPlayerNum === 1 ? 2 : 1;
        const nextPlayer = this.currPlayerNum === 1 ? player1.name : player2.name;
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
            this.setDisplayText('Évasion réussie')
        } else {
            this.setDisplayText('Évasion échouée');
        }
    }

    checkIfDuelOver(player1: PlayerObjects, player2: PlayerObjects): string {
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

    processTurnDialog(player1: PlayerObjects, player2: PlayerObjects){
        this.isPlayer1Damaged = false;
        this.isPlayer2Damaged = false;

        this.playerStat1 = this.playerStat1.includes('Attaque') ? 'Défense D' + player1.attributes.defDiceMax: 'Attaque D' + player1.attributes.atkDiceMax;
        this.playerStat2 = this.playerStat2.includes('Attaque') ? 'Défense D' + player2.attributes.defDiceMax: 'Attaque D' + player2.attributes.atkDiceMax;
    }
}
