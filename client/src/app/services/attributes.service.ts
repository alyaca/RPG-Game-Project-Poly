import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AttributesService {
    private readonly defaultAttribute = '4';
    private readonly highAttribute = '6';
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
        return undefined;
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
        if (speed) {
            if (this.getAttributsValue('health') === this.highAttribute && speedValue === this.highAttribute) {
                this.setHealth(this.defaultAttribute);
            }
            speed.value = speedValue;
        }
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
    saveAttributesValue() {
        const foundAttribute4 = this.attributes.find((attr) => attr.value === this.dice4);
        const foundAttribute6 = this.attributes.find((attr) => attr.value === this.dice6);
        const missingAttributs = this.attributes.filter((attr) => attr.value === this.defaultAttribute).length;
        if (missingAttributs > 1) return false;
        if (foundAttribute4 && foundAttribute6) {
            foundAttribute4.value = Math.floor(Math.random() * Number(this.defaultAttribute) + 1).toString();
            foundAttribute6.value = Math.floor(Math.random() * Number(this.highAttribute) + 1).toString();
            localStorage.setItem('attributes', JSON.stringify(this.attributes));
            return true;
        } else {
            return false;
        }
    }
    resetAttributes() {
        this.setHealth(this.defaultAttribute);
        this.setSpeed(this.defaultAttribute);
        this.setAttack(this.defaultAttribute);
        this.setDefense(this.defaultAttribute);
    }
}
