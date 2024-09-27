import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PopUpComponent } from './popUp.component';

describe('PopUpComponent', () => {
    let component: PopUpComponent;
    let fixture: ComponentFixture<PopUpComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<PopUpComponent>>;
    let routerSpy: jasmine.SpyObj<Router>;
    // let gameCreationServiceSpy: GameCreationService;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            declarations: [PopUpComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PopUpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should select the correct size of the map', () => {
        const size = 'small';
        component.selectSize(size);
        expect(component.selectedSize).toBe(size);
    });

    it('should select the correct mode of the map', () => {
        const mode = 'classic';
        component.selectMode(mode);
        expect(component.selectedMode).toBe(mode);
    });

    it('should close the dialog when close() is called', () => {
        component.close();
        expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('the subit button should be desabled when the mode and size is not selected', () => {
        const result = component.isSubmitDisabled();
        expect(result).toBe(true);
    });

    it('the subit button should be desabled when the size is not selected ', () => {
        const mode = 'classic';
        component.selectMode(mode);
        const result = component.isSubmitDisabled();
        expect(result).toBe(true);
    });

    it('the subit button should be desabled when the mode is not selected ', () => {
        const size = 'small';
        component.selectSize(size);
        const result = component.isSubmitDisabled();
        expect(result).toBe(true);
    });

    it('should navigate to the map creation page and close the dialog when changePage() is called', () => {
        component.changePage();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/edit-map']);
        expect(dialogRefSpy.close).toHaveBeenCalled();
    });
});
