import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { GameGridComponent } from '@app/components/map-editor/game-grid/game-grid.component';
import { GameObjectsContainerComponent } from '@app/components/map-editor/game-objects-container/game-objects-container.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { NO_ITEM, RANDOM_ITEM, SIZE_MEDIUM_MAP, TEST_VALIDATION_DURATION } from '@app/constants';
import { dummyMap } from '@app/mocks/mock-map';
import { mockObjects } from '@app/mocks/mock-object';
import { GameCreationService } from '@app/services/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { MapEditorService } from '@app/services/map-editor.service';
import { SaveGameService } from '@app/services/save-game.service';
import { of } from 'rxjs';
import { MapEditorPageComponent } from './map-editor-page.component';

describe('MapEditorPageComponent', () => {
    let component: MapEditorPageComponent;
    let fixture: ComponentFixture<MapEditorPageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameObjectServiceSpy: jasmine.SpyObj<GameObjectService>;
    let gameCreationServiceSpy: jasmine.SpyObj<GameCreationService>;
    let gameObjectsContainerSpy: jasmine.SpyObj<GameObjectsContainerComponent>;
    let gameGridSpy: jasmine.SpyObj<GameGridComponent>;
    let saveGameServiceSpy: jasmine.SpyObj<SaveGameService>;
    let mapEditorServiceSpy: jasmine.SpyObj<MapEditorService>;

    beforeEach(async () => {
        saveGameServiceSpy = jasmine.createSpyObj('SaveGameService', ['saveNewGame', 'replaceMap']);
        gameCreationServiceSpy = jasmine.createSpyObj('GameCreationService', ['isNewGame', 'updateDimensions']);
        gameObjectServiceSpy = jasmine.createSpyObj('GameObjectService', ['initObjectsArray', 'resetObjectsCount', 'removeObjectFromGrid']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        mapEditorServiceSpy = jasmine.createSpyObj('MapEditorService', [
            'getGridSize',
            'isMapChosen',
            'onDragEnd',
            'getDraggedObject',
            'isDraggingFromContainer',
            'isMapValid',
            'removeObjectFromGrid',
        ]);
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
                { provide: GameObjectService, useValue: gameObjectServiceSpy },
                { provide: MapEditorService, useValue: mapEditorServiceSpy },
                { provide: SaveGameService, useValue: saveGameServiceSpy },
                { provide: GameGridComponent, useValue: gameGridSpy },
                { provide: GameObjectsContainerComponent, useValue: gameObjectsContainerSpy },
                { provide: GameCreationService, useValue: gameCreationServiceSpy },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: Router, useValue: routerSpy },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(MapEditorPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        mapEditorServiceSpy.onDragEnd.and.callFake(() => {
            gameObjectServiceSpy.isDraggingFromContainer = false;
        });
        gameCreationServiceSpy.loadedMapName = 'map title';
        gameCreationServiceSpy.loadedMapDescription = 'map description';
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should set the name and description if it is an existing map', () => {
            gameCreationServiceSpy.isNewGame = false;
            component.ngOnInit();
            expect(component.mapName).toBe(gameCreationServiceSpy.loadedMapName);
            expect(component.mapDescription).toBe(gameCreationServiceSpy.loadedMapDescription);
        });
    });

    describe('drag drop event', () => {
        beforeEach(() => {
            gameObjectServiceSpy.draggedObject = mockObjects[0];
        });

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
            gameObjectServiceSpy.isDraggingFromContainer = true;
            component.onDragEnd();
            expect(gameObjectServiceSpy.isDraggingFromContainer).toBeFalse();
        });

        it('should not call removeObjectFromGrid if the object is moving from the container', () => {
            mapEditorServiceSpy.getDraggedObject.and.returnValue(null);
            gameObjectServiceSpy.isDraggingFromContainer = true;
            mapEditorServiceSpy.isDraggingFromContainer.and.returnValue(true);
            const event = new DragEvent('drop');

            component.onDropOutside(event);
            expect(mapEditorServiceSpy.removeObjectFromGrid).not.toHaveBeenCalled();
        });

        it('should call removeObjectFromGrid if gameObject has id', () => {
            mapEditorServiceSpy.getDraggedObject.and.returnValue(mockObjects[0]);
            gameObjectServiceSpy.isDraggingFromContainer = false;
            const event = new DragEvent('drop');

            component.onDropOutside(event);
            expect(mapEditorServiceSpy.removeObjectFromGrid).toHaveBeenCalled();
        });
    });

    describe('handleReset', () => {
        it('should set the mapName and mapDescription when modifying a map', () => {
            gameCreationServiceSpy.isNewGame = false;
            component.handleReset();
            expect(component.mapName).toBe(gameCreationServiceSpy.loadedMapName);
            expect(component.mapDescription).toBe(gameCreationServiceSpy.loadedMapDescription);
        });

        it('should reset the map name and description when handleReset is called', () => {
            spyOn(component, 'updateMapName');
            spyOn(component, 'updateMapDescription');
            component.handleReset();
            expect(component.resetTrigger).toBeTrue();
            setTimeout(() => {
                expect(component.resetTrigger).toBeFalse();
            }, 0);
        });

        it("should set the map name and description to empty string when we're creating a new map", () => {
            gameCreationServiceSpy.isNewGame = true;
            component.handleReset();
            expect(component.mapName).toBe('');
            expect(component.mapDescription).toBe('');
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
                afterClosed: () => of('left'),
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
            component.setGrid(dummyMap.tiles);
            expect(component.tiles).toBe(dummyMap.tiles);
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

        it('should call saveNewGame if the map is valid', (done) => {
            gameCreationServiceSpy.isNewGame = true;
            mapEditorServiceSpy.isMapValid.and.returnValue(true);
            try {
                component.startSaving();
            } catch (error) {
                expect(error).toBeDefined();
                expect(saveGameServiceSpy.replaceMap).not.toHaveBeenCalled();
                done();
            }
            setTimeout(() => {
                expect(saveGameServiceSpy.saveNewGame).toHaveBeenCalled();
                done();
            }, TEST_VALIDATION_DURATION);
        });

        it("should call replaceMap if the map is valid and we're modifying an existing one", (done) => {
            mapEditorServiceSpy.mapToEdit = dummyMap;
            gameCreationServiceSpy.isNewGame = false;
            mapEditorServiceSpy.isMapValid.and.returnValue(true);
            try {
                component.startSaving();
            } catch (error) {
                expect(error).toBeDefined();
                expect(saveGameServiceSpy.replaceMap).not.toHaveBeenCalled();
                done();
            }
            setTimeout(() => {
                expect(saveGameServiceSpy.replaceMap).toHaveBeenCalled();
                done();
            }, TEST_VALIDATION_DURATION);
        });

        it('should not call saveNewGame if the map is not valid', (done) => {
            gameCreationServiceSpy.isNewGame = true;
            mapEditorServiceSpy.isMapValid.and.returnValue(false);
            try {
                component.startSaving();
            } catch (error) {
                expect(error).toBeDefined();
                expect(saveGameServiceSpy.replaceMap).not.toHaveBeenCalled();
                done();
            }
            setTimeout(() => {
                expect(saveGameServiceSpy.saveNewGame).not.toHaveBeenCalled();
                done();
            }, TEST_VALIDATION_DURATION);
        });

        it('should not call replaceMap if the map is not valid', (done) => {
            mapEditorServiceSpy.isMapValid.and.returnValue(false);
            gameCreationServiceSpy.isNewGame = false;
            try {
                component.startSaving();
            } catch (error) {
                expect(error).toBeDefined();
                expect(saveGameServiceSpy.replaceMap).not.toHaveBeenCalled();
                done();
            }
            setTimeout(() => {
                expect(saveGameServiceSpy.replaceMap).not.toHaveBeenCalled();
                done();
            }, TEST_VALIDATION_DURATION);
        });
    });
});
