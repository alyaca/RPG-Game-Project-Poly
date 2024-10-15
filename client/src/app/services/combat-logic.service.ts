import { Injectable } from '@angular/core';
import { PlayerObjects } from '@app/interfaces/playerObject';
import { DiceComponent } from '@app/components/dice/dice.component';
import { COMBAT_TURN_LENGTH } from '@app/constants';
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

    processAttack(roles: Roles, currPlayerNum: number, player1: PlayerObjects, player2: PlayerObjects): boolean {
        const { attacker, defender, activeDice, inactiveDice } = roles[currPlayerNum];
        const isDefenderPlayer1 = currPlayerNum === 1;

        this.statValue2 =
            currPlayerNum === 1 ? activeDice.value + player1.attributes.attack : inactiveDice.value + player1.attributes.defense;
        this.statValue1 =
            currPlayerNum === 2 ? activeDice.value + player2.attributes.attack : inactiveDice.value + player2.attributes.defense;

        if (activeDice.value + attacker.attributes.attack > inactiveDice.value + defender.attributes.defense) {
            this.dealDamage(defender, isDefenderPlayer1);
            return true;
        }
        return false;
    }

    determineTimerLength(evasions: number[], currPlayerNum: number): number {
        return evasions.length === 0 && currPlayerNum !== 1 ? 3 : COMBAT_TURN_LENGTH;
    }
}
