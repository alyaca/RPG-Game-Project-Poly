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

    it('should set heath to 6 when addHealth is called', () => {
        component.addHealth();
        expect(attributesServiceSpy.setHealth).toHaveBeenCalledWith('6');
    });

    it('should set speed to 6 when addSpeed is called', () => {
        component.addspeed();
        expect(attributesServiceSpy.setSpeed).toHaveBeenCalledWith('6');
    });

    it('should set attack to 1-4 when setAttack is called with 1-4', () => {
        component.setAttack('1-4');
        expect(attributesServiceSpy.setAttack).toHaveBeenCalledWith('1-4');
    });

    it('should set deffense to 1-6 when setDeffense is called with 1-6', () => {
        component.setDefense('1-6');
        expect(attributesServiceSpy.setDefense).toHaveBeenCalledWith('1-6');
    });

    it('should update clickedAvatar when getClickedImage is called', () => {
        const testAvatar = { src: 'Zeus.jpg', name: 'Zues' };
        component.getClickedImage(testAvatar);
        expect(component.clickedAvatar).toEqual(testAvatar);
    });

    it('should call saveAttributesValue and navigate when saveChoices is called', () => {
        attributesServiceSpy.saveAttributesValue.and.returnValue(true);
        component.saveChoices();
        expect(attributesServiceSpy.saveAttributesValue).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/waiting-page']);
        expect(attributesServiceSpy.resetAttributes).toHaveBeenCalled();
    });

    it('should not emit closeCharactorCreator event if saveAttributesValue return false', () => {
        attributesServiceSpy.saveAttributesValue.and.returnValue(false);
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
