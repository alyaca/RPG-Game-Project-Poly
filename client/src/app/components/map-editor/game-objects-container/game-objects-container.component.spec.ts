import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolButtonComponent } from '@app/components/map-editor/tool-button/tool-button.component';
import { ITEM_COUNT } from '@app/constants';
import { mockObjects } from '@app/mocks/mock-object';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { ToolButtonService } from '@app/services/tool-button/tool-button.service';
import { GameObjectsContainerComponent } from './game-objects-container.component';

describe('GameObjectsContainerComponent', () => {
    let component: GameObjectsContainerComponent;
    let fixture: ComponentFixture<GameObjectsContainerComponent>;
    let gameObjectManagerServiceSpy: jasmine.SpyObj<GameObjectService>;
    let toolButtonServiceSpy: jasmine.SpyObj<ToolButtonService>;

    beforeEach(async () => {
        gameObjectManagerServiceSpy = jasmine.createSpyObj('GameObjectService', ['removeObjectFromGrid', 'resetObjectsCount']);
        toolButtonServiceSpy = jasmine.createSpyObj('ToolButtonService', ['toggleButton']);

        await TestBed.configureTestingModule({
            providers: [
                { provide: GameObjectService, useValue: gameObjectManagerServiceSpy },
                { provide: ToolButtonService, useValue: toolButtonServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GameObjectsContainerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('drag start event', () => {
        it('should set draggedObject and isDraggingFromContainer when gameObject count is greater than 0', async () => {
            const mockEvent = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as DragEvent;
            const mockGameObject = { id: 1, name: 'mock', description: 'mock game object for test', count: ITEM_COUNT, image: 'mock/image.png' };

            component.onDragStart(mockEvent, mockGameObject);

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(gameObjectManagerServiceSpy.draggedObject).toEqual(mockGameObject);
            expect(component.isDraggingFromContainer).toBeTrue();
        });

        it('should return when gameObject count is 0', () => {
            const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
            component.onDragStart(mockEvent, mockObjects[1]);
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
            gameObjectManagerServiceSpy.draggedObject = mockObjects[0];
            component.isDraggingFromContainer = true;

            component.onDrop(event, mockObjects[0].id);

            expect(gameObjectManagerServiceSpy.removeObjectFromGrid).not.toHaveBeenCalled();
            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should remove the game object from grid on drop', () => {
            const event = new DragEvent('drop');
            gameObjectManagerServiceSpy.draggedObject = mockObjects[0];
            component.isDraggingFromContainer = false;

            component.onDrop(event, mockObjects[0].id);

            expect(gameObjectManagerServiceSpy.removeObjectFromGrid).toHaveBeenCalledWith(mockObjects[0]);
        });
    });

    it('should prevent default behavior on drag over', () => {
        const event = new DragEvent('dragover');
        const preventDefaultSpy = spyOn(event, 'preventDefault');

        component.onDragOver(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should set isDraggingFromContainer to false on drag end', () => {
        component.onDragEnd();
        expect(component.isDraggingFromContainer).toBeFalse();
    });
});
