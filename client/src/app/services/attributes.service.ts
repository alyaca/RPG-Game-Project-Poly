import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AttributesService {
    readonly defaultAttribute = '4';
    readonly highAttribute = '6';
    name: string = '';
    private readonly dice4 = '1-4';
    private readonly dice6 = '1-6';
    private attributes = [
        { attributeName: 'health', value: this.defaultAttribute },
        { attributeName: 'speed', value: this.defaultAttribute },
        { attributeName: 'attack', value: this.defaultAttribute },
        { attributeName: 'defense', value: this.defaultAttribute },
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
                return this.getAttributsValue('health') === this.highAttribute;
            case 'speed':
                return this.getAttributsValue('speed') === this.highAttribute;
            case 'attack4':
                return this.getAttributsValue('attack') === this.dice4;
            case 'attack6':
                return this.getAttributsValue('attack') === this.dice6;
            case 'defense4':
                return this.getAttributsValue('defense') === this.dice4;
            case 'defense6':
                return this.getAttributsValue('defense') === this.dice6;
            default:
                return undefined;
        }
    }

    setHealth(healthValue: string) {
        const health = this.findAttribut('health');
        if (health) {
            if (this.getAttributsValue('speed') === this.highAttribute && healthValue === this.highAttribute) {
                this.setSpeed(this.defaultAttribute);
            }
            health.value = healthValue;
        }
    }
    setSpeed(speedValue: string) {
        const speed = this.findAttribut('speed');
        if (!speed) {
            return;
        }
        if (this.getAttributsValue('health') === this.highAttribute && speedValue === this.highAttribute) {
            this.setHealth(this.defaultAttribute);
        }
        speed.value = speedValue;
    }
    setAttack(attackValue: string) {
        const attack = this.findAttribut('attack');
        if (attack) {
            attack.value = attackValue;
            if (this.getAttributsValue('defense') === this.dice6 && attackValue === this.dice6) {
                this.setDefense(this.dice4);
            } else if (this.getAttributsValue('defense') === this.dice4 && attackValue === this.dice4) {
                this.setDefense(this.dice6);
            }
        }
    }

    setDefense(defenseValue: string) {
        const defense = this.findAttribut('defense');
        if (defense) {
            defense.value = defenseValue;
            if (this.getAttributsValue('attack') === this.dice6 && defenseValue === this.dice6) {
                this.setAttack(this.dice4);
            } else if (this.getAttributsValue('attack') === this.dice4 && defenseValue === this.dice4) {
                this.setAttack(this.dice6);
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
        const missingAttributs = this.attributes.filter((attr) => attr.value === this.defaultAttribute).length;
        if (missingAttributs > 1) {
            return 'Veuillez sélectionner les valeurs des attributs souhaités';
        }
        return true;
    }

    saveAttributes(): void {
        const foundAttribute4 = this.attributes.find((attr) => attr.value === this.dice4);
        const foundAttribute6 = this.attributes.find((attr) => attr.value === this.dice6);
        if (foundAttribute4 && foundAttribute6) {
            foundAttribute4.value = this.generateRandomAttributes();
            foundAttribute6.value = this.generateRandomAttributes();
            localStorage.setItem('attributes', JSON.stringify(this.attributes));
        }
    }

    generateRandomAttributes() {
        return Math.floor(parseInt(this.defaultAttribute, 10) + Math.random() * Number(this.defaultAttribute) + 1).toString();
    }

    resetAttributes() {
        this.setHealth(this.defaultAttribute);
        this.setSpeed(this.defaultAttribute);
        this.setAttack(this.defaultAttribute);
        this.setDefense(this.defaultAttribute);
        this.name = '';
    }
}
