import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToolButtonComponent } from '@app/components/map-editor/tool-button/tool-button.component';
import { GameMode, ITEM_COUNT, NO_OBJECT } from '@app/constants';
import { mockObjects } from '@app/mocks/mock-object';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { ToolButtonService } from '@app/services/tool-button/tool-button.service';
import { GameObjectsContainerComponent } from './game-objects-container.component';

describe('GameObjectsContainerComponent', () => {
    let component: GameObjectsContainerComponent;
    let fixture: ComponentFixture<GameObjectsContainerComponent>;
    let gameObjectManagerServiceSpy: jasmine.SpyObj<GameObjectService>;
    let toolButtonServiceSpy: jasmine.SpyObj<ToolButtonService>;
    let gameCreationServiceSpy: jasmine.SpyObj<GameCreationService>;

    beforeEach(async () => {
        gameObjectManagerServiceSpy = jasmine.createSpyObj('GameObjectService', [
            'removeObjectFromGrid',
            'resetObjectsCount',
            'initObjectsArray',
            'getObjectById',
            'getGameObjectOnTile',
            'updateObjectGridPosition',
            'removeObjectFromGrid',
            'removeObjectByClick',
            'resetDrag',
            'loadMapObjectCount',
            'ngOnDestroy',
        ]);
        toolButtonServiceSpy = jasmine.createSpyObj('ToolButtonService', ['toggleButton']);
        gameCreationServiceSpy = jasmine.createSpyObj('GameCreationService', ['isNewGame', 'getGameMode']);
        await TestBed.configureTestingModule({
            providers: [
                { provide: GameObjectService, useValue: gameObjectManagerServiceSpy },
                { provide: ToolButtonService, useValue: toolButtonServiceSpy },
                { provide: GameCreationService, useValue: gameCreationServiceSpy },
            ],
        }).compileComponents();
        gameObjectManagerServiceSpy.objects = mockObjects;

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

        it('should prevent default behaviour when gameObject count is 0', () => {
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

    it('should prevent default behaviour on drag over ', () => {
        const mockEvent = jasmine.createSpyObj('DragEvent', ['preventDefault']);
        component.onDragOver(mockEvent);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should set isDraggingFromContainer to false on drag end', () => {
        component.onDragEnd();
        expect(component.isDraggingFromContainer).toBeFalse();
    });

    it('should call loadMapObjectCount if not a new game', () => {
        gameCreationServiceSpy.isNewGame = false;
        gameObjectManagerServiceSpy.objects = mockObjects;
        component.ngOnInit();
        expect(gameObjectManagerServiceSpy.resetObjectsCount).toHaveBeenCalled();
        expect(gameObjectManagerServiceSpy.loadMapObjectCount).toHaveBeenCalled();
    });

    it('should load a new game with a flag object if the game mode is CTF', () => {
        gameCreationServiceSpy.isNewGame = true;
        gameCreationServiceSpy.getGameMode.and.returnValue(GameMode.Ctf);
        gameObjectManagerServiceSpy.objects = mockObjects;
        component.ngOnInit();
        expect(gameObjectManagerServiceSpy.resetObjectsCount).toHaveBeenCalled();
    });

    it('should load a new game without a flag object if the game mode is not CTF', () => {
        gameCreationServiceSpy.isNewGame = true;
        gameCreationServiceSpy.getGameMode.and.returnValue(GameMode.Classic);
        gameObjectManagerServiceSpy.objects = mockObjects;
        component.ngOnInit();
        expect(gameObjectManagerServiceSpy.resetObjectsCount).toHaveBeenCalled();
    });
});
