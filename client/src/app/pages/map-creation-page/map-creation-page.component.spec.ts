import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP } from '@app/constants';
import { SaveGameService } from '@app/services/save-game.service';
import { of } from 'rxjs';
import { MapCreationPageComponent } from './map-creation-page.component';

import SpyObj = jasmine.SpyObj;

describe('MapCreationPageComponent', () => {
    let saveGameServiceSpy: SpyObj<SaveGameService>;
    let component: MapCreationPageComponent;
    let fixture: ComponentFixture<MapCreationPageComponent>;

    beforeEach(async () => {
        saveGameServiceSpy = jasmine.createSpyObj('SaveGameService', ['saveGame']);
        await TestBed.configureTestingModule({
            imports: [MapCreationPageComponent],
            providers: [
                provideHttpClient(),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of({}),
                        snapshot: { paramMap: { get: () => 'map' } },
                    },
                },
            ],
        }).compileComponents();
        TestBed.overrideProvider(SaveGameService, { useValue: saveGameServiceSpy });

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

    describe('Setters', () => {
        it('should set the grid attribute correctly', () => {
            const mockGridValue = [
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            ];
            component.setGrid(mockGridValue);
            expect(component.grid).toBe(mockGridValue);
        });

        it('should set the height attribute correctly', () => {
            const mockHeightValue = 15;
            component.setHeight(mockHeightValue);
            expect(component.height).toBe(mockHeightValue);
        });
    });

    describe('Saving start process', () => {
        it('clicking the "Sauvegarder" button should call startSaving', () => {
            spyOn(component, 'startSaving');
            const saveButton = fixture.debugElement.query(By.css('#save-button'));
            saveButton.triggerEventHandler('click');
            expect(component.startSaving).toHaveBeenCalled();
        });

        // lines 93-102 not tested and i don't know how to fucking test them
    });
});
