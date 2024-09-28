import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { NB_ITEMS_LARGE_MAP, NB_ITEMS_MEDIUM_MAP, NB_ITEMS_SMALL_MAP } from '@app/constants';
import { of } from 'rxjs';
import { MapCreationPageComponent } from './map-creation-page.component';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';

describe('MapCreationPageComponent', () => {
    let component: MapCreationPageComponent;
    let fixture: ComponentFixture<MapCreationPageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(async () => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
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
});
