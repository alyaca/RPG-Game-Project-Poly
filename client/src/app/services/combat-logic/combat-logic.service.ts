import { Injectable } from '@angular/core';
import { Player } from '@common/player';
import { COMBAT_TURN_LENGTH, SHORT_COMBAT_TURN_LENGTH, EVADE_SUCCES_RATE, DISPLAY_TEXT_DELAY } from '@app/constants';
import { CombatInfo } from '@common/combat-info'

@Injectable({
    providedIn: 'root',
})
export class CombatLogicService {
    combatInfo: CombatInfo = {
        isPlayer1Damaged: false,
        isPlayer2Damaged: false,
        statValue1: 0,
        statValue2: 0,
        displayText: '',
        isGameOngoing: true,
        currPlayerNum: '',
        evasionsArray1: new Array(2).fill(1),
        evasionsArray2: new Array(2).fill(1),
        playerStat1: '',
        playerStat2: '',
        roles: {},
        isDraw: false,
    
        attackInProgress: false,
    }
    
    // combatInfo: CombatInfo;

    initCombat(player1: Player, player2: Player) {
        this.combatInfo.currPlayerNum = this.determineStartingPlayer(player1, player2);
        this.combatInfo.playerStat1 =
            this.combatInfo.currPlayerNum === 'player1turn' ? 'Attaque D' + player1.attributes.atkDiceMax : 'Défense D' + player1.attributes.defDiceMax;
        this.combatInfo.playerStat2 =
            this.combatInfo.currPlayerNum === 'player1turn' ? 'Défense D' + player2.attributes.defDiceMax : 'Attaque D' + player2.attributes.atkDiceMax;
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

        this.combatInfo.isPlayer1Damaged = isDefenderPlayer1;
        this.combatInfo.isPlayer2Damaged = !isDefenderPlayer1;
    }

    processAttack(activeDiceValue: number, inactiveDiceValue: number, player1: Player, player2: Player) {
        this.combatInfo.attackInProgress = true;

        const { attacker, defender } = this.combatInfo.roles[this.combatInfo.currPlayerNum];
        const isDefenderPlayer1 = this.combatInfo.currPlayerNum === 'player1turn';

        this.combatInfo.statValue2 =
            this.combatInfo.currPlayerNum === 'player1turn' ? activeDiceValue + player1.attributes.attack : inactiveDiceValue + player1.attributes.defense;
        this.combatInfo.statValue1 =
            this.combatInfo.currPlayerNum === 'player2turn' ? activeDiceValue + player2.attributes.attack : inactiveDiceValue + player2.attributes.defense;

        if (activeDiceValue + attacker.attributes.attack > inactiveDiceValue + defender.attributes.defense) {
            this.dealDamage(defender, isDefenderPlayer1);
            this.setDisplayText('attaque réussie de ' + attacker.name);
        } else {
            this.setDisplayText('attaque échouée de ' + attacker.name);
        }

        this.combatInfo.attackInProgress = false;
    }

    determineTimerLength(evasions: number[], currPlayerNum: string): number {
        return evasions.length === 0 && currPlayerNum !== 'player1turn' ? SHORT_COMBAT_TURN_LENGTH : COMBAT_TURN_LENGTH;
    }

    setDisplayText(text: string) {
        this.combatInfo.displayText = '';
        setTimeout(() => {
            this.combatInfo.displayText = text;
        }, DISPLAY_TEXT_DELAY);
    }

    switchTurn() {
        this.combatInfo.currPlayerNum = this.combatInfo.currPlayerNum === 'player1turn' ? 'player2turn' : 'player1turn';
    }

    attemptEvade() {
        if (this.combatInfo.evasionsArray1.length === 0) {
            this.setDisplayText("Évasion pas possible, vous n'avez plus d'évasions restantes");
            return;
        }
        this.combatInfo.evasionsArray1.pop();
        if (Math.random() < EVADE_SUCCES_RATE) {
            this.combatInfo.isDraw = true;
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
        } else if (this.combatInfo.isDraw) {
            this.setDisplayText('Évasion réussie');
            return 'Partie nulle';
        }
        return '';
    }

    processTurnDialog(player1: Player, player2: Player) {
        this.combatInfo.isPlayer1Damaged = false;
        this.combatInfo.isPlayer2Damaged = false;

        this.combatInfo.playerStat1 = this.combatInfo.playerStat1.includes('Attaque')
            ? 'Défense D' + player1.attributes.defDiceMax
            : 'Attaque D' + player1.attributes.atkDiceMax;
        this.combatInfo.playerStat2 = this.combatInfo.playerStat2.includes('Attaque')
            ? 'Défense D' + player2.attributes.defDiceMax
            : 'Attaque D' + player2.attributes.atkDiceMax;
    }
}
