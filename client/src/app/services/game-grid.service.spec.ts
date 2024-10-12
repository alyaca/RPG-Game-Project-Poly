import { TestBed } from '@angular/core/testing';

import { GameGridService } from './game-grid.service';

describe('GameGridService', () => {
  let service: GameGridService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameGridService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
