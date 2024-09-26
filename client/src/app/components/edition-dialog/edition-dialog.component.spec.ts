import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EditionDialogComponent } from './edition-dialog.component';

describe('EditionDialogComponent', () => {
    let component: EditionDialogComponent;
    let fixture: ComponentFixture<EditionDialogComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EditionDialogComponent>>;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: { message: 'Test message', confirm: true } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(EditionDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should close dialog with "leave" when onClose is called with confirm true', () => {
        component.onClose();
        expect(dialogRefSpy.close).toHaveBeenCalledWith('leave');
    });

    it('should close dialog with "close" when onClose is called with confirm false', () => {
        component.data.confirm = false; 
        component.onClose();
        expect(dialogRefSpy.close).toHaveBeenCalledWith('close');
    });

    it('should close dialog with "cancel" when onCancel is called', () => {
        component.onCancel();
        expect(dialogRefSpy.close).toHaveBeenCalledWith('cancel');
    });

    it('should have injected data correctly', () => {
        expect(component.data).toEqual({ message: 'Test message', title: 'title', confirm: true });
    });
});
