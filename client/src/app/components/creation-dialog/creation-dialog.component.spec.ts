import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MESSAGE_DURATION_SAVE_CHOICE } from '@app/constants';
import { CreationDialogComponent } from './creation-dialog.component';

describe('CreationDialogComponent', () => {
    let component: CreationDialogComponent;
    let fixture: ComponentFixture<CreationDialogComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CreationDialogComponent>>;
    let routerSpy: jasmine.SpyObj<Router>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

        await TestBed.configureTestingModule({
            declarations: [CreationDialogComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: Router, useValue: routerSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(CreationDialogComponent);
        component = fixture.componentInstance;
        fixture.autoDetectChanges();
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

    it('the submit button should be disabled when the mode and size is not selected', () => {
        const result = component.isSubmitDisabled();
        expect(result).toBe(true);
    });

    it('the submit button should be disabled when the size is not selected ', () => {
        const mode = 'classic';
        component.selectMode(mode);
        const result = component.isSubmitDisabled();
        expect(result).toBe(true);
    });

    it('the submit button should be disabled when the mode is not selected ', () => {
        const size = 'small';
        component.selectSize(size);
        const result = component.isSubmitDisabled();
        expect(result).toBe(true);
    });

    it('should show snack bar when isSubmitDisabled return true ', () => {
        component.changePage();
        expect(snackBarSpy.open).toHaveBeenCalledWith('Veuillez choisir la taille et le mode de jeu', 'Fermer', {
            duration: MESSAGE_DURATION_SAVE_CHOICE,
        });
        expect(component.isSubmitDisabled).not.toBeFalsy();
    });

    it('should navigate to the map creation page and close the dialog when size and mode are selected', () => {
        const size = 'small';
        const mode = 'classic';
        component.selectSize(size);
        component.selectMode(mode);
        component.changePage();
        expect(dialogRefSpy.close).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/edit-map']);
    });
});
