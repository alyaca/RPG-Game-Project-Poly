import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AttributesService } from '@app/services/attributes.service';
import { CharacterCreatorComponent } from './character-creator.component';
import SpyObj = jasmine.SpyObj;

describe('CharacterCreatorComponent', () => {
    let component: CharacterCreatorComponent;
    let fixture: ComponentFixture<CharacterCreatorComponent>;
    let attributesServiceSpy: SpyObj<AttributesService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        attributesServiceSpy = jasmine.createSpyObj('AttributesService', [
            'setHealth',
            'setSpeed',
            'setAttack',
            'setDefense',
            'getAttributsValue',
            'findAttribut',
            'saveAttributesValue',
            'resetAttributes',
            'validateName',
            'validateAttributes',
            'saveAttributes',
            'generateRandomAttributes',
            'isButtonSelected',
            'setCharacterName',
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        await TestBed.configureTestingModule({
            imports: [MatSnackBarModule, BrowserAnimationsModule],
            providers: [
                { provide: AttributesService, useValue: attributesServiceSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(CharacterCreatorComponent);
        component = fixture.componentInstance;
        fixture.autoDetectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set characterName to ABC when setName is called with ABC', () => {
        component.setName('ABC');
        expect(component.characterName).toEqual('ABC');
    });

    it('should set health to 6 when addHealth is called', () => {
        component.addHealth();
        expect(attributesServiceSpy.setHealth).toHaveBeenCalledWith('6');
    });

    it('should return 4 when getAttributsValue is called with health', () => {
        attributesServiceSpy.getAttributsValue.and.returnValue('4');
        expect(component.getAttributsValue('health')).toEqual('4');
    });

    it('should set speed to 6 when addSpeed is called', () => {
        component.addSpeed();
        expect(attributesServiceSpy.setSpeed).toHaveBeenCalledWith('6');
    });

    it('should set attack to 4 + (1-4) when setAttack is called with 1-4', () => {
        component.setAttack('4 + (1-4)');
        expect(attributesServiceSpy.setAttack).toHaveBeenCalledWith('4 + (1-4)');
    });

    it('should set defense to 4 + (1-6) when setDeffense is called with 1-6', () => {
        component.setDefense('4 + (1-6)');
        expect(attributesServiceSpy.setDefense).toHaveBeenCalledWith('4 + (1-6)');
    });

    it('should update clickedAvatar when getClickedImage is called', () => {
        const testAvatar = { src: 'Zeus.jpg', name: 'Zues' };
        component.getClickedImage(testAvatar);
        expect(component.clickedAvatar).toEqual(testAvatar);
    });

    it('should call saveAttributesValue and navigate when saveChoices is called', () => {
        attributesServiceSpy.saveAttributesValue.and.returnValue(undefined);
        component.saveChoices();
        expect(attributesServiceSpy.saveAttributesValue).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/waiting-page']);
    });

    it('should not emit closeCharactorCreator event if saveAttributesValue return false', () => {
        attributesServiceSpy.saveAttributesValue.and.returnValue('Echec');
        component.saveChoices();
        expect(attributesServiceSpy.resetAttributes).toHaveBeenCalledTimes(0);
    });

    it('should emit closeCharactorCreator event and call resetAttributes when closeComponent is called', () => {
        spyOn(component.closeCharactorCreator, 'emit');
        component.closeComponent();
        expect(component.closeCharactorCreator.emit).toHaveBeenCalled();
        expect(attributesServiceSpy.resetAttributes).toHaveBeenCalled();
    });
});
