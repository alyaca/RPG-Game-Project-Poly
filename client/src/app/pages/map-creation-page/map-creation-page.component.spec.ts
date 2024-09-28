import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { of } from 'rxjs';
import { MapCreationPageComponent } from './map-creation-page.component';

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
