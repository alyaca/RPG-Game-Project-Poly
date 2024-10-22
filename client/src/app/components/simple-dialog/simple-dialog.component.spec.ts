import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { SimpleDialogComponent } from './simple-dialog.component';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { SimpleDialogMessageComponent } from '@app/components/simple-dialog-message/simple-dialog-message.component';

describe('SimpleDialogComponent', () => {
    let component: SimpleDialogComponent;
    let fixture: ComponentFixture<SimpleDialogComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SimpleDialogComponent>>;
    let mockRouter: Router;

    beforeEach(async () => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [NoopAnimationsModule, MatDialogModule, MatButtonModule, CommonModule, SimpleDialogMessageComponent],
            providers: [
                { provide: MatDialogRef, useValue: dialogRefSpy },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        messages: ['Test message'],
                        title: 'Test title',
                        confirm: true,
                        options: ['option1', 'option2'],
                    },
                },
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

    it('should close dialog with "left" when onClose is called with confirm true', () => {
        component.onClose();
        expect(dialogRefSpy.close).toHaveBeenCalledWith('left');
    });

    it('should close dialog with "close" when onClose is called with confirm false', () => {
        component.data.confirm = false;
        component.onClose();
        expect(dialogRefSpy.close).toHaveBeenCalledWith('close');
    });

    it('should close dialog with "right" when onCancel is called', () => {
        component.onCancel();
        expect(dialogRefSpy.close).toHaveBeenCalledWith('right'); 
    });

    it('should navigate to /administration when title is "Sauvegarde réussie"', () => {
        component.data.title = 'Sauvegarde réussie';
        component.onClose();
        expect(dialogRefSpy.close).toHaveBeenCalledWith('left');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/administration']);
    });
});
