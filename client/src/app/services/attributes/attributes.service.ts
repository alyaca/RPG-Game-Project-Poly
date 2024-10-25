import { Injectable } from '@angular/core';
import { DEFAULT_ATTRIBUTE, DICE_4, DICE_6, HIGH_ATTRIBUTE } from '@app/constants';
import { defaultAttributes } from '@app/default-attributes';
import { PlayerStats } from '@common/player';

@Injectable({
    providedIn: 'root',
})
export class AttributesService {
    readonly validateError = {
        missingAttributes: 'Veuillez sélectionner les valeurs des attributs souhaités',
        missingName: 'Veuillez entrer un nom de personnage',
    };
    name: string = '';
    attributes: PlayerStats = { ...defaultAttributes };

    setCharacterName(name: string) {
        this.name = name;
    }

    setAttribute(highAttribute: keyof PlayerStats, defaultAttribute: keyof PlayerStats) {
        this.attributes[highAttribute] = HIGH_ATTRIBUTE;
        this.attributes[defaultAttribute] = DEFAULT_ATTRIBUTE;
    }

    setHealth() {
        this.setAttribute('totalHp', 'speed');
    }

    setSpeed() {
        this.setAttribute('speed', 'totalHp');
    }

    setAttack(dice: string) {
        if (dice === 'attack4') {
            this.setAttribute('defDiceMax', 'atkDiceMax');
        } else {
            this.setAttribute('atkDiceMax', 'defDiceMax');
        }
    }

    setDefense(dice: string) {
        if (dice === 'defense4') {
            this.setAttribute('atkDiceMax', 'defDiceMax');
        } else {
            this.setAttribute('defDiceMax', 'atkDiceMax');
        }
    }

    hasName() {
        return this.name.trim();
    }

    hasSelectedAttributes() {
        const { totalHp, speed } = this.attributes;
        const selectedHealthSpeed = totalHp === DEFAULT_ATTRIBUTE && speed === DEFAULT_ATTRIBUTE;
        return !selectedHealthSpeed && this.hasSelectedDice();
    }

    hasSelectedDice() {
        const { atkDiceMax, defDiceMax } = this.attributes;
        return !(atkDiceMax === DEFAULT_ATTRIBUTE && defDiceMax === DEFAULT_ATTRIBUTE);
    }

    resetAttributes() {
        this.name = '';
        this.attributes = { ...defaultAttributes };
    }

    getAttributValue(chosenAttribute: keyof PlayerStats) {
        if (chosenAttribute.includes('DiceMax') && this.hasSelectedDice()) {
            return this.getDiceMessage(chosenAttribute);
        }
        return this.attributes[chosenAttribute];
    }

    saveAttributesValue() {
        if (!this.hasName()) return this.validateError.missingName;
        if (!this.hasSelectedAttributes()) {
            return this.validateError.missingAttributes;
        }
        return '';
    }

    getDiceMessage(chosenAttribute: keyof PlayerStats) {
        const diceValue = this.attributes[chosenAttribute];
        if (diceValue === DEFAULT_ATTRIBUTE) {
            return DICE_4;
        }
        return DICE_6;
    }

    isButtonSelected(buttonName: string) {
        const { totalHp, speed, atkDiceMax, defDiceMax } = this.attributes;
        const highAttributeSelected = (value: number) => value === HIGH_ATTRIBUTE;
        const defaultAttributeSelected = (value: number) => value === DEFAULT_ATTRIBUTE;

        switch (buttonName) {
            case 'health':
                return highAttributeSelected(totalHp);
            case 'speed':
                return highAttributeSelected(speed);
            case 'attack4':
                return this.hasSelectedDice() && defaultAttributeSelected(atkDiceMax);
            case 'attack6':
                return highAttributeSelected(atkDiceMax);
            case 'defense4':
                return this.hasSelectedDice() && defaultAttributeSelected(defDiceMax);
            case 'defense6':
                return highAttributeSelected(defDiceMax);
            default:
                return undefined;
        }
    }

    setAllStats() {
        this.attributes.currentHp = this.attributes.totalHp;
        this.attributes.movementPointsLeft = this.attributes.speed;
    }
}
