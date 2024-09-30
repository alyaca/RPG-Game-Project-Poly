import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP } from '@app/constants';
import { SaveGameService } from '@app/services/save-game.service';
import { of } from 'rxjs';
import { MapCreationPageComponent } from './map-creation-page.component';

import SpyObj = jasmine.SpyObj;

describe('MapCreationPageComponent', () => {
    let saveGameServiceSpy: SpyObj<SaveGameService>;
    let component: MapCreationPageComponent;
    let fixture: ComponentFixture<MapCreationPageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        saveGameServiceSpy = jasmine.createSpyObj('SaveGameService', ['saveGame']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                provideHttpClient(),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        paramMap: of({}),
                        snapshot: { paramMap: { get: () => 'map' } },
                    },
                },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
        TestBed.overrideProvider(SaveGameService, { useValue: saveGameServiceSpy });

        fixture = TestBed.createComponent(MapCreationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the component', () => {
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

        it('should set randomItemCount and spawnPointCount to NB_ITEMS_SMALL_MAP when selectedSize is small', () => {
            component.selectedSize = 'small';
            component.updateItemCount();
            expect(component.randomItemCount).toBe(NB_ITEMS_SMALL_MAP);
            expect(component.spawnPointCount).toBe(NB_ITEMS_SMALL_MAP);
        });

        it('should set randomItemCount and spawnPointCount to NB_ITEMS_MEDIUM_MAP when selectedSize is medium', () => {
            component.selectedSize = 'medium';
            component.updateItemCount();
            expect(component.randomItemCount).toBe(NB_ITEMS_MEDIUM_MAP);
            expect(component.spawnPointCount).toBe(NB_ITEMS_MEDIUM_MAP);
        });

        it('should set randomItemCount and spawnPointCount to NB_ITEMS_LARGE_MAP when selectedSize is large', () => {
            component.selectedSize = 'large';
            component.updateItemCount();
            expect(component.randomItemCount).toBe(NB_ITEMS_LARGE_MAP);
            expect(component.spawnPointCount).toBe(NB_ITEMS_LARGE_MAP);
        });
    });

    describe('handleReset', () => {
        it('should reset the map name and description when handleReset is called', () => {
            spyOn(component, 'updateMapName');
            spyOn(component, 'updateMapDescription');

            component.handleReset();

            expect(component.resetTrigger).toBeTrue();
            expect(component.updateMapName).toHaveBeenCalledWith('');
            expect(component.updateMapDescription).toHaveBeenCalledWith('');

            setTimeout(() => {
                expect(component.resetTrigger).toBeFalse();
            }, 0);
        });
    });

    describe('handleSave', () => {
        it('should trigger save when handleSave is called', () => {
            component.handleSave();

            expect(component.saveTrigger).toBeTrue();

            setTimeout(() => {
                expect(component.saveTrigger).toBeFalse();
            }, 0);
        });
    });

    describe('handleExit', () => {
        it('should navigate to /admin if user confirms exit in handleExit', () => {
            const dialogRef: MatDialogRef<SimpleDialogComponent> = {
                afterClosed: () => of('leave'),
                close: jasmine.createSpy('close'),
                disableClose: false,
            } as unknown as MatDialogRef<SimpleDialogComponent>;

            dialogSpy.open.and.returnValue(dialogRef);
            component.handleExit();

            expect(dialogSpy.open).toHaveBeenCalled();
            dialogRef.afterClosed().subscribe(() => {
                expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
            });
        });
    });

    describe('updateMapName and updateMapDescription', () => {
        it('should update the map name when updateMapName is called', () => {
            const newName = 'New Map Name';
            component.updateMapName(newName);
            expect(component.mapName).toBe(newName);
        });

        it('should update the map description when updateMapDescription is called', () => {
            const newDescription = 'New Map Description';
            component.updateMapDescription(newDescription);
            expect(component.mapDescription).toBe(newDescription);
        });
    });

    describe('Setters', () => {
        it('should set the grid attribute correctly', () => {
            const mockGridValue = [
                [1, 2, 3, 4, 5, 6, 5, 4, 9, 10],
                [3, 4, 5, 6, 7, 8, 9, 0, 1, 2],
            ];
            component.setGrid(mockGridValue);
            expect(component.grid).toBe(mockGridValue);
        });

        it('should set the height attribute correctly', () => {
            const mockHeightValue = 15;
            component.setHeight(mockHeightValue);
            expect(component.height).toBe(mockHeightValue);
        });

        it('should set the new items matrix correctly', () => {
            const mockItemsValue = [
                [1, 0, 2, 0, 0, 0, 0, 0],
                [0, 0, 2, 0, 0, 0, 3, 0, 0],
            ];
            component.setItems(mockItemsValue);
            expect(component.items).toBe(mockItemsValue);
        });
    });

    describe('Saving start process', () => {
        it('clicking the "Sauvegarder" button should call startSaving', () => {
            spyOn(component, 'startSaving');
            const saveButton = fixture.debugElement.query(By.css('#save-button'));
            saveButton.triggerEventHandler('click');
            expect(component.startSaving).toHaveBeenCalled();
        });
    });
});
