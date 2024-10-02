import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolButtonComponent } from '@app/components/map-editor/tool-button/tool-button.component';
import { NO_OBJECT } from '@app/constants';
import { dummyMap } from '@app/mocks/mock-map';
import { mockObjects } from '@app/mocks/mock-object';
import { GameGridService } from '@app/services/game-grid.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { ToolButtonService } from '@app/services/tool-button/tool-button.service';
import { GameObjectsContainerComponent } from './game-objects-container.component';

describe('GameObjectsContainerComponent', () => {
    let component: GameObjectsContainerComponent;
    let fixture: ComponentFixture<GameObjectsContainerComponent>;
    let gameObjectServiceSpy: jasmine.SpyObj<GameObjectService>;
    let toolButtonServiceSpy: jasmine.SpyObj<ToolButtonService>;
    let gameGridServiceSpy: jasmine.SpyObj<GameGridService>;

    beforeEach(async () => {
        gameObjectServiceSpy = jasmine.createSpyObj('GameObjectService', ['removeObjectFromGrid', 'resetObjectsCount', 'updateObjectsContainer']);
        toolButtonServiceSpy = jasmine.createSpyObj('ToolButtonService', ['toggleButton', 'toggleActivation']);
        gameGridServiceSpy = jasmine.createSpyObj('GameGridService', ['hasMapToEditSubject', 'mapToEdit']);

        await TestBed.configureTestingModule({
            providers: [
                { provide: GameObjectService, useValue: gameObjectServiceSpy },
                { provide: ToolButtonService, useValue: toolButtonServiceSpy },
                { provide: GameGridService, useValue: gameGridServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameObjectsContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('onInit', () => {
        it('should initialize gameObjects and reset objects count', () => {
            gameObjectServiceSpy.objects = mockObjects;
            gameObjectServiceSpy.resetObjectsCount.and.callThrough();
            gameGridServiceSpy.hasMapToEditSubject = true;
            gameGridServiceSpy.mapToEdit = dummyMap;

            component.ngOnInit();

            expect(component.gameObjects).toEqual(mockObjects);
            expect(gameObjectServiceSpy.resetObjectsCount).toHaveBeenCalled();
            expect(gameObjectServiceSpy.updateObjectsContainer).toHaveBeenCalled();
        });
    });

    describe('drag start event', () => {
        it('should set draggedObject and isDraggingFromContainer when gameObject count is greater than 0', async () => {
            const mockEvent = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as DragEvent;
            const mockGameObject = mockObjects[0];

            component.onDragStart(mockEvent, mockGameObject);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(gameObjectServiceSpy.draggedObject).toEqual(mockGameObject);
            expect(component.isDraggingFromContainer).toBeTrue();
        });

        it('should prevent default behavioour when gameObject count is 0', () => {
            const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
            const mockObject = mockObjects[1];
            mockObject.count = NO_OBJECT;
            component.onDragStart(mockEvent, mockObject);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        it('should toggle button activation and set selectedButton to null when dragging', () => {
            const mockButton = new ToolButtonComponent(toolButtonServiceSpy);
            mockButton.buttonName = 'Mock Button';
            toolButtonServiceSpy.selectedButton = mockButton;
            const event = new DragEvent('dragstart');

            component.onDragStart(event, mockObjects[0]);

            expect(mockButton.isActive).toBeTrue();
            expect(toolButtonServiceSpy.selectedButton).toBeNull();
        });
    });

    describe('drop event', () => {
        it('should not remove the game object if isDraggingFromContainer is  true', () => {
            const event = new DragEvent('drop');
            const preventDefaultSpy = spyOn(event, 'preventDefault');
            gameObjectServiceSpy.draggedObject = mockObjects[0];
            component.isDraggingFromContainer = true;

            component.onDrop(event, mockObjects[0].id);

            expect(gameObjectServiceSpy.removeObjectFromGrid).not.toHaveBeenCalled();
            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should remove the game object from grid on drop', () => {
            const event = new DragEvent('drop');
            gameObjectServiceSpy.draggedObject = mockObjects[0];
            component.isDraggingFromContainer = false;

            component.onDrop(event, mockObjects[0].id);

            expect(gameObjectServiceSpy.removeObjectFromGrid).toHaveBeenCalledWith(mockObjects[0]);
        });
    });

    it('should prevent default behaviour on drag over ', () => {
        const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
        component.onDragOver(mockEvent);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should set isDraggingFromContainer to false on drag end', () => {
        component.onDragEnd();
        expect(component.isDraggingFromContainer).toBeFalse();
    });
});
