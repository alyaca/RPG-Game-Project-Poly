import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditionGameGridComponent } from './edition-game-grid.component';

describe('EditionGameGridComponent', () => {
    let component: EditionGameGridComponent;
    let fixture: ComponentFixture<EditionGameGridComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditionGameGridComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(EditionGameGridComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have the correct number of tiles', () => {
        expect(component.gridArray.length).toEqual(component.height * component.width);
    });
});
