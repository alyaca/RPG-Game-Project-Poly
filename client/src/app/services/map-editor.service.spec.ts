import { TestBed } from '@angular/core/testing';
import { GameCreationService } from '@app/services/game-creation.service';
import { GameObjectService } from '@app/services/game-object/game-object.service';
import { MapValidatorService } from '@app/services/map-validator/map-validator.service';
import { MapEditorService } from './map-editor.service';
// import { Game } from '@common/game';
// import { of } from 'rxjs';

describe('MapEditorService', () => {
    let service: MapEditorService;
    // let gameCreationServiceSpy: jasmine.SpyObj<GameCreationService>;
    // let gameObjectServiceSpy: jasmine.SpyObj<GameObjectService>;
    // let mapValidatorServiceSpy: jasmine.SpyObj<MapValidatorService>;

    beforeEach(() => {
        const gameCreationSpy = jasmine.createSpyObj('GameCreationService', ['getStoredSize', 'sizeSubject']);
        const gameObjectSpy = jasmine.createSpyObj('GameObjectService', ['removeObjectFromGrid', 'isDraggingFromContainer']);
        const mapValidatorSpy = jasmine.createSpyObj('MapValidatorService', ['validMap']);
        TestBed.configureTestingModule({
            providers: [
                { provide: GameCreationService, useValue: gameCreationSpy },
                { provide: GameObjectService, useValue: gameObjectSpy },
                { provide: MapValidatorService, useValue: mapValidatorSpy },
            ],
        });
        service = TestBed.inject(MapEditorService);
        // gameCreationServiceSpy = TestBed.inject(GameCreationService) as jasmine.SpyObj<GameCreationService>;
        // gameObjectServiceSpy = TestBed.inject(GameObjectService) as jasmine.SpyObj<GameObjectService>;
        // mapValidatorServiceSpy = TestBed.inject(MapValidatorService) as jasmine.SpyObj<MapValidatorService>;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
