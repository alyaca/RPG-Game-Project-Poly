import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { NO_ITEM, RANDOM_ITEM, SIZE_MEDIUM_MAP } from '@app/constants';
import { mockObjects } from '@app/mocks/mock-object';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { TileType } from '@app/services/map-validator/map-validator.service';
import { of } from 'rxjs';
import { MapEditorPageComponent } from './map-editor-page.component';

describe('MapEditorPageComponent', () => {
    let component: MapEditorPageComponent;
    let fixture: ComponentFixture<MapEditorPageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameObjectService: GameObjectService;

    beforeEach(async () => {
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
                provideHttpClient(),
                GameObjectService,
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
        gameObjectService = TestBed.inject(GameObjectService);
        fixture = TestBed.createComponent(MapEditorPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        gameObjectService.isDraggingFromContainer = true;
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('drag drop event', () => {
        it('should call event.preventDefault on drag over ', () => {
            const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
            component.onDragOver(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should add object to container when drop outside grid', () => {
            const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
            component.onDropOutside(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should set isDraggingFromContainer to false on drag end', () => {
            component.onDragEnd();
            expect(gameObjectService.isDraggingFromContainer).toBeFalse();
        });

        it('should call removeObjectFromGrid if gameObject has id', () => {
            gameObjectService.draggedObject = mockObjects[0];
            gameObjectService.isDraggingFromContainer = false;
            spyOn(gameObjectService, 'removeObjectFromGrid');
            const event = new DragEvent('drop');

            component.onDropOutside(event);

            expect(gameObjectService.removeObjectFromGrid).toHaveBeenCalledWith(mockObjects[0]);
        });
    });

    describe('handleReset', () => {
        it('should reset the map name and description when handleReset is called', () => {
            spyOn(component, 'updateMapName');
            spyOn(component, 'updateMapDescription');
            component.handleReset();
            expect(component.resetTrigger).toBeTrue();
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
        it('should navigate to /administration if user confirms exit in handleExit', () => {
            const dialogRef: MatDialogRef<SimpleDialogComponent> = {
                afterClosed: () => of('leave'),
                close: jasmine.createSpy('close'),
                disableClose: false,
            } as unknown as MatDialogRef<SimpleDialogComponent>;

            dialogSpy.open.and.returnValue(dialogRef);
            component.handleExit();

            expect(dialogSpy.open).toHaveBeenCalled();
            dialogRef.afterClosed().subscribe(() => {
                expect(routerSpy.navigate).toHaveBeenCalledWith(['/administration']);
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
                [
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                ],
                [
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                    TileType.Ground,
                ],
            ];
            component.setGrid(mockGridValue);
            expect(component.tiles).toBe(mockGridValue);
        });

        it('should set the height attribute correctly', () => {
            const mockHeightValue = SIZE_MEDIUM_MAP;
            component.setHeight(mockHeightValue);
            expect(component.height).toBe(mockHeightValue);
        });

        it('should set the new items matrix correctly', () => {
            const mockItemsValue = [
                [NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM, NO_ITEM],
                [NO_ITEM, RANDOM_ITEM, NO_ITEM, NO_ITEM, NO_ITEM],
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
