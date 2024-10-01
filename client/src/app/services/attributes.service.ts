import { Injectable } from '@angular/core';
import { DEFAULT_ATTRIBUTE, DICE_4, DICE_6, HIGH_ATTRIBUTE } from '@app/constants';

@Injectable({
    providedIn: 'root',
})
export class AttributesService {
    name: string = '';
    private attributes = [
        { attributeName: 'health', value: DEFAULT_ATTRIBUTE.toString() },
        { attributeName: 'speed', value: DEFAULT_ATTRIBUTE.toString() },
        { attributeName: 'attack', value: DEFAULT_ATTRIBUTE.toString() },
        { attributeName: 'defense', value: DEFAULT_ATTRIBUTE.toString() },
    ];

    findAttribut(chosenAttribute: string) {
        return this.attributes.find((attr) => attr.attributeName === chosenAttribute);
    }

    getAttributsValue(chosenAttribute: string) {
        const attribute = this.findAttribut(chosenAttribute);
        if (attribute) {
            return attribute.value;
        }
        return;
    }

    isButtonSelected(buttonName: string) {
        switch (buttonName) {
            case 'health':
                return this.getAttributsValue('health') === HIGH_ATTRIBUTE;
            case 'speed':
                return this.getAttributsValue('speed') === HIGH_ATTRIBUTE;
            case 'attack4':
                return this.getAttributsValue('attack') === DICE_4;
            case 'attack6':
                return this.getAttributsValue('attack') === DICE_6;
            case 'defense4':
                return this.getAttributsValue('defense') === DICE_4;
            case 'defense6':
                return this.getAttributsValue('defense') === DICE_6;
            default:
                return undefined;
        }
    }

    setHealth(healthValue: string) {
        const health = this.findAttribut('health');
        if (health) {
            if (this.getAttributsValue('speed') === HIGH_ATTRIBUTE && healthValue === HIGH_ATTRIBUTE) {
                this.setSpeed(DEFAULT_ATTRIBUTE);
            }
            health.value = healthValue;
        }
    }
    setSpeed(speedValue: string) {
        const speed = this.findAttribut('speed');
        if (!speed) {
            return;
        }
        if (this.getAttributsValue('health') === HIGH_ATTRIBUTE && speedValue === HIGH_ATTRIBUTE) {
            this.setHealth(DEFAULT_ATTRIBUTE);
        }
        speed.value = speedValue;
    }
    setAttack(attackValue: string) {
        const attack = this.findAttribut('attack');
        if (attack) {
            attack.value = attackValue;
            if (this.getAttributsValue('defense') === DICE_6 && attackValue === DICE_6) {
                this.setDefense(DICE_4);
            } else if (this.getAttributsValue('defense') === DICE_4 && attackValue === DICE_4) {
                this.setDefense(DICE_6);
            }
        }
    }

    setDefense(defenseValue: string) {
        const defense = this.findAttribut('defense');
        if (defense) {
            defense.value = defenseValue;
            if (this.getAttributsValue('attack') === DICE_6 && defenseValue === DICE_6) {
                this.setAttack(DICE_4);
            } else if (this.getAttributsValue('attack') === DICE_4 && defenseValue === DICE_4) {
                this.setAttack(DICE_6);
            }
        }
    }
    setCharacterName(name: string) {
        this.name = name;
    }

    saveAttributesValue(): undefined | string {
        const nameCheck = this.validateName();
        if (nameCheck !== true) return nameCheck;
        localStorage.setItem('name', this.name);

        const attributeCheck = this.validateAttributes();
        if (attributeCheck !== true) return attributeCheck;
        this.saveAttributes();
        this.resetAttributes();
        return;
    }

    validateName(): true | string {
        if (!this.name.trim()) {
            return 'Le nom du personnage est requis';
        }
        return true;
    }

    validateAttributes(): true | string {
        const missingAttributs = this.attributes.filter((attr) => attr.value === DEFAULT_ATTRIBUTE).length;
        if (missingAttributs > 1) {
            return 'Veuillez sélectionner les valeurs des attributs souhaités';
        }
        return true;
    }

    saveAttributes(): void {
        const foundAttribute4 = this.attributes.find((attr) => attr.value === DICE_4);
        const foundAttribute6 = this.attributes.find((attr) => attr.value === DICE_6);
        if (foundAttribute4 && foundAttribute6) {
            foundAttribute4.value = this.generateRandomAttributes();
            foundAttribute6.value = this.generateRandomAttributes();
            localStorage.setItem('attributes', JSON.stringify(this.attributes));
        }
    }

    generateRandomAttributes(): string {
        return Math.floor(parseInt(DEFAULT_ATTRIBUTE, 10) + Math.random() * Number(DEFAULT_ATTRIBUTE) + 1).toString();
    }

    resetAttributes() {
        this.setHealth(DEFAULT_ATTRIBUTE);
        this.setSpeed(DEFAULT_ATTRIBUTE);
        this.setAttack(DEFAULT_ATTRIBUTE);
        this.setDefense(DEFAULT_ATTRIBUTE);
        this.name = '';
    }
}
