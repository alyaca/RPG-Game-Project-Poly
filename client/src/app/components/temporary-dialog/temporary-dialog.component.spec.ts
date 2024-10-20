import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemporaryDialogComponent } from './temporary-dialog.component';

describe('TemporaryDialogComponent', () => {
    let component: TemporaryDialogComponent;
    let fixture: ComponentFixture<TemporaryDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TemporaryDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(TemporaryDialogComponent);
        component = fixture.componentInstance;
        component.duration = 100;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show the dialog with a message', () => {
        const message = 'Test Message';
        component.show(message);
        
        expect(component.message).toBe(message);
        expect(component.isVisible).toBe(true);
    });

    it('should hide the dialog after the specified duration', (done) => {
        component.show('Test Message');

        setTimeout(() => {
            expect(component.isVisible).toBe(false);
            done();
        }, 150); // Wait slightly longer than the duration to ensure it has hidden
    });

    it('should set the message correctly when shown multiple times', () => {
        component.show('First Message');
        expect(component.message).toBe('First Message');

        component.show('Second Message');
        expect(component.message).toBe('Second Message');
        expect(component.isVisible).toBe(true);
    });
});
