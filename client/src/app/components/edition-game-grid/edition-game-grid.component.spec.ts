import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
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

    it('should set map to small size values', () => {
        component.selectedSize = 'small';
        component.updateDimensions();
        expect(component.height).toEqual(SIZE_SMALL_MAP);
        expect(component.width).toEqual(SIZE_SMALL_MAP);
    });

    it('should set map to medium size values', () => {
        component.selectedSize = 'medium';
        component.updateDimensions();
        expect(component.height).toEqual(SIZE_MEDIUM_MAP);
        expect(component.width).toEqual(SIZE_MEDIUM_MAP);
    });

    it('should set map to large size values', () => {
        component.selectedSize = 'large';
        component.updateDimensions();
        expect(component.height).toEqual(SIZE_LARGE_MAP);
        expect(component.width).toEqual(SIZE_LARGE_MAP);
    });

    it('should have the correct number of tiles', () => {
        const nRows = component.gridArray.length;
        const nCols = component.gridArray[0]?.length || 0;

        expect(nRows * nCols).toEqual(component.height * component.width);
    });
});
