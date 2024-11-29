import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SinglePlayerStatComponent } from './single-player-stat.component';

describe('SinglePlayerStatComponent', () => {
    let component: SinglePlayerStatComponent;
    let fixture: ComponentFixture<SinglePlayerStatComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SinglePlayerStatComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SinglePlayerStatComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
