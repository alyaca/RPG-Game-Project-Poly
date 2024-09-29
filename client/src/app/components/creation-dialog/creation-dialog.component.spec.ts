import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CreationDialogComponent } from './creation-dialog.component';

describe('PopUpComponent', () => {
    let component: CreationDialogComponent;
    let fixture: ComponentFixture<CreationDialogComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CreationDialogComponent>>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            declarations: [CreationDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CreationDialogComponent);
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

    it('the submit button should be desabled when the mode and size is not selected', () => {
        const result = component.isSubmitDisabled();
        expect(result).toBe(true);
    });

    it('the submit button should be desabled when the size is not selected ', () => {
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
