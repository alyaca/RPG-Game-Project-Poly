import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemporaryDialogComponent } from './temporary-dialog.component';
import { LONG_TEMP_DIALOG_DURATION, TEMP_DIALOG_DURATION } from '@app/constants';

describe('TemporaryDialogComponent', () => {
    let component: TemporaryDialogComponent;
    let fixture: ComponentFixture<TemporaryDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TemporaryDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TemporaryDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show the dialog with a message', () => {
        const message = 'Test Message';
        component.show(message, TEMP_DIALOG_DURATION);

        expect(component.message).toBe(message);
        expect(component.isVisible).toBe(true);
    });

    it('should hide the dialog after the specified duration', (done) => {
        component.show('Test Message', LONG_TEMP_DIALOG_DURATION);

        setTimeout(() => {
            expect(component.isVisible).toBe(false);
            done();
        }, LONG_TEMP_DIALOG_DURATION);
    });

    it('should set the message correctly when shown multiple times', () => {
        component.show('First Message', TEMP_DIALOG_DURATION);
        expect(component.message).toBe('First Message');

        component.show('Second Message', TEMP_DIALOG_DURATION);
        expect(component.message).toBe('Second Message');
        expect(component.isVisible).toBe(true);
    });
});
