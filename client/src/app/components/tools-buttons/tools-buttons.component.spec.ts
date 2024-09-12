import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolsButtonsComponent } from './tools-buttons.component';

describe('ToolsButtonsComponent', () => {
  let component: ToolsButtonsComponent;
  let fixture: ComponentFixture<ToolsButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolsButtonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolsButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
