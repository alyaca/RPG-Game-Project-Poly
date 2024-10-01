import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SimpleDialogComponent } from './simple-dialog.component';
import { Router } from '@angular/router';

describe('SimpleDialogComponent', () => {
    let component: SimpleDialogComponent;
    let fixture: ComponentFixture<SimpleDialogComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SimpleDialogComponent>>;
    let mockRouter: Router;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                { provide: MAT_DIALOG_DATA, useValue: { message: 'Test message', confirm: true } },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SimpleDialogComponent);
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

    it('should set title to "Quitter cette page?" if confirm is true', () => {
        component.data.confirm = true;
        component.ngOnInit();
        expect(component.data.title).toBe('Quitter cette page?');
    });

    it('should not change title if confirm is false', () => {
        component.data.title = 'Test Title';
        component.data.confirm = false;
        component.ngOnInit();
        expect(component.data.title).toBe('Test Title');
    });

    it('should navigate to /administion when title is "Sauvegarde réussie"', () => {
        component.data.title = 'Sauvegarde réussie';
        component.onClose();
        expect(dialogRefSpy.close).toHaveBeenCalledWith('leave');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/administration']);
    });
});
