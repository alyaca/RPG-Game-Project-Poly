import { ComponentFixture, TestBed } from '@angular/core/testing';

import { mockPlayer } from '@app/mocks/mock-player';
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

    it('should update the movement value', () => {
        component.player = mockPlayer;
        component.increaseMovement();
        expect(component.player.attributes.movementPointsLeft).toBe(mockPlayer.attributes.movementPointsLeft);

        component.decreaseMovement();
        expect(component.player.attributes.movementPointsLeft).toBe(mockPlayer.attributes.movementPointsLeft);
    });

    it('should not update the movement points if you already have max or minimum value for it', () => {
        component.player = mockPlayer;
        component.player.attributes.movementPointsLeft = component.player.attributes.speed;
        component.increaseMovement();
        expect(component.player.attributes.movementPointsLeft).toBe(mockPlayer.attributes.speed);

        component.player.attributes.movementPointsLeft = 0;
        component.decreaseMovement();
        expect(component.player.attributes.movementPointsLeft).toBe(0);
    });

    it('should update the action points', () => {
        component.player.attributes.actionPoints = mockPlayer.attributes.actionPoints;
        component.increaseActionPoints();
        expect(component.player.attributes.actionPoints).toBe(mockPlayer.attributes.actionPoints + 1);

        component.decreaseActionPoints();
        expect(component.player.attributes.actionPoints).toBe(mockPlayer.attributes.actionPoints);
    });

    it('should not update the action points value if it is already at the max or min', () => {
        component.player.attributes.actionPoints = mockPlayer.attributes.maxActionPoints;
        component.player.attributes.maxActionPoints = mockPlayer.attributes.maxActionPoints;
        component.increaseActionPoints();
        expect(component.player.attributes.actionPoints).toBe(mockPlayer.attributes.maxActionPoints);

        component.player.attributes.actionPoints = 0;
        component.decreaseActionPoints();
        expect(component.player.attributes.actionPoints).toBe(0);
    });

    it('should update the totalHp value', () => {
        component.player.attributes.currentHp = mockPlayer.attributes.currentHp;
        component.increaseHP();
        expect(component.player.attributes.currentHp).toBe(mockPlayer.attributes.currentHp + 1);

        component.decreaseHP();
        expect(component.player.attributes.currentHp).toBe(mockPlayer.attributes.currentHp);
    });

    it('should not update the totalHp value if already at max or min', () => {
        component.player.attributes.totalHp = mockPlayer.attributes.totalHp;
        component.player.attributes.currentHp = mockPlayer.attributes.totalHp;
        component.increaseHP();
        expect(component.player.attributes.currentHp).toBe(component.player.attributes.totalHp);

        component.player.attributes.currentHp = 0;
        component.decreaseHP();
        expect(component.player.attributes.currentHp).toBe(0);
    });
});
