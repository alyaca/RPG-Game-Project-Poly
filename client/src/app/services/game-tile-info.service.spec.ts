import { TestBed } from '@angular/core/testing';

import { GameTileInfoService } from './game-tile-info.service';

describe('GameTileInfoService', () => {
  let service: GameTileInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameTileInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
