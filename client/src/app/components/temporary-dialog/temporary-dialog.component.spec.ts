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
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
