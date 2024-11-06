import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TilePlayerInfoComponent } from './tile-player-info.component';

describe('TilePlayerInfoComponent', () => {
  let component: TilePlayerInfoComponent;
  let fixture: ComponentFixture<TilePlayerInfoComponent>;
  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [],
      providers: [],
    }).compileComponents();

    fixture = TestBed.createComponent(TilePlayerInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closePopup event when close is called', () => {
    spyOn(component.closePopup, 'emit');
    component.close();
    expect(component.closePopup.emit).toHaveBeenCalled();
  });
});
