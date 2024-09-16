import { TestBed } from '@angular/core/testing';

import { AttributesService } from './attributes.service';

describe('AttributesService', () => {
    let service: AttributesService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AttributesService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return the correct attribute object for health with a default value of 4', () => {
        const attribute = service.findAttribut('health');
        expect(attribute).toEqual({ attributeName: 'health', value: '4' });
    });

    it('should return the correct attribute object for attack with a default value of ?', () => {
        const value = service.getAttributsValue('attack');
        expect(value).toEqual('?');
    });

    it('should return undefined for unknown attribute', () => {
        const value = service.getAttributsValue('age');
        expect(value).toEqual(undefined);
    });

    it('should update health attribute value to 6 when setHealth is called ', () => {
        service.setHealth('6');
        const health = service.getAttributsValue('health');
        expect(health).toEqual('6');
    });

    it('should set health to 6 and speed to 4 when setHealth is called after setSpeed ', () => {
        service.setSpeed('6');
        service.setHealth('6');
        const health = service.getAttributsValue('health');
        const speed = service.getAttributsValue('speed');
        expect(health).toEqual('6');
        expect(speed).toEqual('4');
    });

    it('should set speed to 6 and health to 4 when setSpeed is called after setHealth ', () => {
        service.setHealth('6');
        service.setSpeed('6');
        const health = service.getAttributsValue('health');
        const speed = service.getAttributsValue('speed');
        expect(health).toEqual('4');
        expect(speed).toEqual('6');
    });

    it('should set attack to 1-6 and defense to 1-4 when setAttack is called after setDefense ', () => {
        service.setDefense('1-6');
        service.setAttack('1-6');
        const defense = service.getAttributsValue('defense');
        const attack = service.getAttributsValue('attack');
        expect(attack).toEqual('1-6');
        expect(defense).toEqual('1-4');
    });

    it('should set attack to 1-4 and defense to 1-6 when setAttack is called after setDefense ', () => {
        service.setDefense('1-4');
        service.setAttack('1-4');
        const defense = service.getAttributsValue('defense');
        const attack = service.getAttributsValue('attack');
        expect(attack).toEqual('1-4');
        expect(defense).toEqual('1-6');
    });

    it('should set defense to 1-4 and attack to 1-6 when setDefense is called after setAttack ', () => {
        service.setAttack('1-4');
        service.setDefense('1-4');
        const defense = service.getAttributsValue('defense');
        const attack = service.getAttributsValue('attack');
        expect(attack).toEqual('1-6');
        expect(defense).toEqual('1-4');
    });

    it('should set defense to 1-6 and attack to 1-4 when setDefense is called after setAttack ', () => {
        service.setAttack('1-6');
        service.setDefense('1-6');
        const defense = service.getAttributsValue('defense');
        const attack = service.getAttributsValue('attack');
        expect(attack).toEqual('1-4');
        expect(defense).toEqual('1-6');
    });

    it('should return true from saveAttributesValue when all attributes are set ', () => {
        service.setAttack('1-6');
        service.setDefense('1-4');
        service.setHealth('6');
        service.setSpeed('4');
        const isCompleted = service.saveAttributesValue();
        expect(isCompleted).toEqual(true);
    });

    it('should return false from saveAttributesValue when not all attributes are set ', () => {
        service.setAttack('1-6');
        service.setDefense('1-4');
        const isCompleted = service.saveAttributesValue();
        expect(isCompleted).toEqual(false);
    });

    it('should return false from saveAttributesValue when only some attributes are set ', () => {
        service.setHealth('6');
        service.setSpeed('4');
        const isCompleted = service.saveAttributesValue();
        expect(isCompleted).toEqual(false);
    });

    it('should reset all attributes to default values when resetAttributes is called ', () => {
        service.setAttack('1-6');
        service.setDefense('1-4');
        service.setHealth('6');
        service.setSpeed('4');
        service.resetAttributes();

        const health = service.getAttributsValue('health');
        const speed = service.getAttributsValue('speed');
        const attack = service.getAttributsValue('attack');
        const defense = service.getAttributsValue('defense');
        expect(health).toEqual('4');
        expect(speed).toEqual('4');
        expect(attack).toEqual('?');
        expect(defense).toEqual('?');
    });
});
