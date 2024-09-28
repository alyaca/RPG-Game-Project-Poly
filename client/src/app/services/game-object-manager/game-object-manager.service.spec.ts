import { TestBed } from '@angular/core/testing';
import { GameObjectManagerService } from './game-object-manager.service';

describe('GameObjectManagerService', () => {
    let service: GameObjectManagerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameObjectManagerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
