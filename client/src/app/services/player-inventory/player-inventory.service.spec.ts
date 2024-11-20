import { TestBed } from '@angular/core/testing';

import { PlayerInventoryService } from './player-inventory.service';

describe('PlayerInventoryService', () => {
    let service: PlayerInventoryService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PlayerInventoryService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
