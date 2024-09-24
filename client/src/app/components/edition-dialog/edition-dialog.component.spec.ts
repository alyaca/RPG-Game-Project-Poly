import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditionDialogComponent } from './edition-dialog.component';

describe('EditionDialogComponent', () => {
  let component: EditionDialogComponent;
  let fixture: ComponentFixture<EditionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
