import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditionToolbarComponent } from './edition-toolbar.component';

describe('EditionToolbarComponent', () => {
    let component: EditionToolbarComponent;
    let fixture: ComponentFixture<EditionToolbarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditionToolbarComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EditionToolbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
