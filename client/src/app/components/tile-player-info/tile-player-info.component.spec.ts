import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TilePlayerInfoComponent } from './tile-player-info.component';

describe('TilePlayerInfoComponent', () => {
  let component: TilePlayerInfoComponent;
  let fixture: ComponentFixture<TilePlayerInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TilePlayerInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TilePlayerInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
