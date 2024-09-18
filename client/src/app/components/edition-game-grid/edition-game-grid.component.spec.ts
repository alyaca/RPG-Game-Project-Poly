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

        component.height = 3;
        component.width = 3;
        component.gridArray = [
            [1, 1, 1],
            [1, 1, 1],
            [1, 1, 1],
        ];

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have the correct number of tiles', () => {
        const nRows = component.gridArray.length;
        const nCols = component.gridArray[0]?.length || 0;

        expect(nRows * nCols).toEqual(component.height * component.width);
    });
});
