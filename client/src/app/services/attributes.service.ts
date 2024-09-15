import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AttributesService {
    attributes = [
        { attributeName: 'health', value: '4' },
        { attributeName: 'speed', value: '4' },
        { attributeName: 'attack', value: '?' },
        { attributeName: 'defense', value: '?' },
    ];

    constructor() {}

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
            if (this.getAttributsValue('speed') == '6') {
                this.setSpeed('4');
            }
            health.value = healthValue;
        }
    }
    setSpeed(speedValue: string) {
        const speed = this.findAttribut('speed');
        if (speed) {
            if (this.getAttributsValue('health') == '6') {
                this.setHealth('4');
            }
            speed.value = speedValue;
        }
    }
    setAttack(attackValue: string) {
        const attack = this.findAttribut('attack');
        if (attack) {
            attack.value = attackValue;
            if (this.getAttributsValue('defense') == '1-6' && attackValue == '1-6') {
                this.setDefense('1-4');
            } else if (this.getAttributsValue('defense') == '1-4' && attackValue == '1-4') {
                this.setDefense('1-6');
            }
        }
    }

    setDefense(defenseValue: string) {
        const defense = this.findAttribut('defense');
        if (defense) {
            defense.value = defenseValue;
            if (this.getAttributsValue('attack') == '1-6' && defenseValue == '1-6') {
                this.setAttack('1-4');
            } else if (this.getAttributsValue('attack') == '1-4' && defenseValue == '1-4') {
                this.setAttack('1-6');
            }
        }
    }
    saveAttributesValue() {
        const foundAttribute4 = this.attributes.find((attr) => attr.value === '1-4');
        const foundAttribute6 = this.attributes.find((attr) => attr.value === '1-6');
        const badAttribut = this.attributes.filter((attr) => attr.value === '4').length;
        if (badAttribut > 1) return;
        if (foundAttribute4 && foundAttribute6) {
            foundAttribute4.value = (Math.floor(Math.random() * 4) + 1).toString();
            foundAttribute6.value = (Math.floor(Math.random() * 6) + 1).toString();
            localStorage.setItem('attributes', JSON.stringify(this.attributes));
            return true;
        } else {
            return;
        }
    }
    resetAttributes() {
        this.attributes = [
            { attributeName: 'health', value: '4' },
            { attributeName: 'speed', value: '4' },
            { attributeName: 'attack', value: '?' },
            { attributeName: 'defense', value: '?' },
        ];
    }
}
