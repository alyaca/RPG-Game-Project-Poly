import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerInfoInventoryComponent } from './player-info-inventory.component';

describe('PlayerInfoInventoryComponent', () => {
    let component: PlayerInfoInventoryComponent;
    let fixture: ComponentFixture<PlayerInfoInventoryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PlayerInfoInventoryComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayerInfoInventoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
