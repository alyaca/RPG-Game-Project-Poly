import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP } from '@app/constants';
import { MapCreationPageComponent } from './map-creation-page.component';

describe('MapCreationPageComponent', () => {
    let component: MapCreationPageComponent;
    let fixture: ComponentFixture<MapCreationPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [MapCreationPageComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(MapCreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Selected map size', () => {
        it('should update selectedSize and call updateItemCount on selection change', () => {
            spyOn(component, 'updateItemCount');

            const mockEvent = { value: 'medium' };
            component.onSelectionChange(mockEvent);

            expect(component.selectedSize).toBe('medium');
            expect(component.updateItemCount).toHaveBeenCalled();
        });

        it('should set randomItemCount and spawnPointCount to NB_OBJECTS_SMALL_MAP when selectedSize is small', () => {
            component.selectedSize = 'small';
            component.updateItemCount();
            expect(component.randomItemCount).toBe(NB_ITEMS_SMALL_MAP);
            expect(component.spawnPointCount).toBe(NB_ITEMS_SMALL_MAP);
        });

        it('should set randomItemCount and spawnPointCount to NB_OBJECTS_MEDIUM_MAP when selectedSize is medium', () => {
            component.selectedSize = 'medium';
            component.updateItemCount();
            expect(component.randomItemCount).toBe(NB_ITEMS_MEDIUM_MAP);
            expect(component.spawnPointCount).toBe(NB_ITEMS_MEDIUM_MAP);
        });

        it('should set randomItemCount and spawnPointCount to NB_OBJECTS_LARGE_MAP when selectedSize is large', () => {
            component.selectedSize = 'large';
            component.updateItemCount();
            expect(component.randomItemCount).toBe(NB_ITEMS_LARGE_MAP);
            expect(component.spawnPointCount).toBe(NB_ITEMS_LARGE_MAP);
        });
    });
});
