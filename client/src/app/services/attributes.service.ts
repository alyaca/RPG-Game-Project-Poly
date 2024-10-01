import { Injectable } from '@angular/core';

export enum AttributeValues {
    DefaultAttribute = '4',
    HighAttribute = '6',
    Dice4 = '1-4',
    Dice6 = '1-6',
}

@Injectable({
    providedIn: 'root',
})
export class AttributesService {
    name: string = '';
    private attributes = [
        { attributeName: 'health', value: AttributeValues.DefaultAttribute.toString() },
        { attributeName: 'speed', value: AttributeValues.DefaultAttribute.toString() },
        { attributeName: 'attack', value: AttributeValues.DefaultAttribute.toString() },
        { attributeName: 'defense', value: AttributeValues.DefaultAttribute.toString() },
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
                return this.getAttributsValue('health') === AttributeValues.HighAttribute;
            case 'speed':
                return this.getAttributsValue('speed') === AttributeValues.HighAttribute;
            case 'attack4':
                return this.getAttributsValue('attack') === AttributeValues.Dice4;
            case 'attack6':
                return this.getAttributsValue('attack') === AttributeValues.Dice6;
            case 'defense4':
                return this.getAttributsValue('defense') === AttributeValues.Dice4;
            case 'defense6':
                return this.getAttributsValue('defense') === AttributeValues.Dice6;
            default:
                return undefined;
        }
    }

    setHealth(healthValue: string) {
        const health = this.findAttribut('health');
        if (health) {
            if (this.getAttributsValue('speed') === AttributeValues.HighAttribute && healthValue === AttributeValues.HighAttribute) {
                this.setSpeed(AttributeValues.DefaultAttribute);
            }
            health.value = healthValue;
        }
    }
    setSpeed(speedValue: string) {
        const speed = this.findAttribut('speed');
        if (!speed) {
            return;
        }
        if (this.getAttributsValue('health') === AttributeValues.HighAttribute && speedValue === AttributeValues.HighAttribute) {
            this.setHealth(AttributeValues.DefaultAttribute);
        }
        speed.value = speedValue;
    }
    setAttack(attackValue: string) {
        const attack = this.findAttribut('attack');
        if (attack) {
            attack.value = attackValue;
            if (this.getAttributsValue('defense') === AttributeValues.Dice6 && attackValue === AttributeValues.Dice6) {
                this.setDefense(AttributeValues.Dice4);
            } else if (this.getAttributsValue('defense') === AttributeValues.Dice4 && attackValue === AttributeValues.Dice4) {
                this.setDefense(AttributeValues.Dice6);
            }
        }
    }

    setDefense(defenseValue: string) {
        const defense = this.findAttribut('defense');
        if (defense) {
            defense.value = defenseValue;
            if (this.getAttributsValue('attack') === AttributeValues.Dice6 && defenseValue === AttributeValues.Dice6) {
                this.setAttack(AttributeValues.Dice4);
            } else if (this.getAttributsValue('attack') === AttributeValues.Dice4 && defenseValue === AttributeValues.Dice4) {
                this.setAttack(AttributeValues.Dice6);
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
        const missingAttributs = this.attributes.filter((attr) => attr.value === AttributeValues.DefaultAttribute).length;
        if (missingAttributs > 1) {
            return 'Veuillez sélectionner les valeurs des attributs souhaités';
        }
        return true;
    }

    saveAttributes(): void {
        const foundAttribute4 = this.attributes.find((attr) => attr.value === AttributeValues.Dice4);
        const foundAttribute6 = this.attributes.find((attr) => attr.value === AttributeValues.Dice6);
        if (foundAttribute4 && foundAttribute6) {
            foundAttribute4.value = this.generateRandomAttributes();
            foundAttribute6.value = this.generateRandomAttributes();
            localStorage.setItem('attributes', JSON.stringify(this.attributes));
        }
    }

    generateRandomAttributes(): string {
        return Math.floor(parseInt(AttributeValues.DefaultAttribute, 10) + Math.random() * Number(AttributeValues.DefaultAttribute) + 1).toString();
    }

    resetAttributes() {
        this.setHealth(AttributeValues.DefaultAttribute);
        this.setSpeed(AttributeValues.DefaultAttribute);
        this.setAttack(AttributeValues.DefaultAttribute);
        this.setDefense(AttributeValues.DefaultAttribute);
        this.name = '';
    }
}
