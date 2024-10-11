import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnStartComponent } from './turn-start.component';

describe('TurnStartComponent', () => {
  let component: TurnStartComponent;
  let fixture: ComponentFixture<TurnStartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnStartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
