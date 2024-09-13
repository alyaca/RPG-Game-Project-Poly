import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AttributesService {
    attributes = [
        { attributeName: 'health', value: 4 },
        { attributeName: 'speed', value: 4 },
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

    setHealth(healthValue: number) {
        const health = this.findAttribut('health');
        if (health) {
            if (this.getAttributsValue('speed') == 6) {
                this.setSpeed(4);
            }
            health.value = healthValue;
        }
    }
    setSpeed(speedValue: number) {
        const speed = this.findAttribut('speed');
        if (speed) {
            if (this.getAttributsValue('health') == 6) {
                this.setHealth(4);
            }
            speed.value = speedValue;
        }
    }
    setAttack(attackValue: string) {
        const attack = this.findAttribut('attack');
        if (attack) {
            if (this.getAttributsValue('defense') == '1-6' && attackValue == '1-6') {
                this.setDefense('1-4');
            }
            attack.value = attackValue;
        }
    }

    setDefense(defenseValue: string) {
        const defense = this.findAttribut('defense');
        if (defense) {
            if (this.getAttributsValue('attack') == '1-6' && defenseValue == '1-6') {
                this.setAttack('1-4');
            }
            defense.value = defenseValue;
        }
    }
}
