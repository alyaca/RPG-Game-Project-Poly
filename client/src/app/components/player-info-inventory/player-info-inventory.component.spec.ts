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
        component.playerInfo = mockPlayer;
        component.increaseMovement();
        expect(component.playerInfo.movementPointsLeft).toBe(mockPlayer.movementPointsLeft);

        component.decreaseMovement();
        expect(component.playerInfo.movementPointsLeft).toBe(mockPlayer.movementPointsLeft);
    });

    it('should not update the movement points if you already have max or minimum value for it', () => {
        component.playerInfo.movementPointsLeft = mockPlayer.speed;
        component.increaseMovement();
        expect(component.playerInfo.movementPointsLeft).toBe(mockPlayer.speed);

        component.playerInfo.movementPointsLeft = 0;
        component.decreaseMovement();
        expect(component.playerInfo.movementPointsLeft).toBe(0);
    });

    it('should update the action points', () => {
        component.playerInfo.actionPoints = mockPlayer.actionPoints;
        component.increaseActionPoints();
        expect(component.playerInfo.actionPoints).toBe(mockPlayer.actionPoints + 1);

        component.decreaseActionPoints();
        expect(component.playerInfo.actionPoints).toBe(mockPlayer.actionPoints);
    });

    it('should not update the action points value if it is already at the max or min', () => {
        component.playerInfo.actionPoints = mockPlayer.maxActionPoints;
        component.playerInfo.maxActionPoints = mockPlayer.maxActionPoints;
        component.increaseActionPoints();
        expect(component.playerInfo.actionPoints).toBe(mockPlayer.maxActionPoints);

        component.playerInfo.actionPoints = 0;
        component.decreaseActionPoints();
        expect(component.playerInfo.actionPoints).toBe(0);
    });

    it('should update the hp value', () => {
        component.playerInfo.currentHp = mockPlayer.currentHp;
        component.increaseHP();
        expect(component.playerInfo.currentHp).toBe(mockPlayer.currentHp + 1);

        component.decreaseHP();
        expect(component.playerInfo.currentHp).toBe(mockPlayer.currentHp);
    });

    it('should not update the hp value if already at max or min', () => {
        component.playerInfo.hp = mockPlayer.hp;
        component.playerInfo.currentHp = mockPlayer.hp;
        component.increaseHP();
        expect(component.playerInfo.currentHp).toBe(component.playerInfo.hp);

        component.playerInfo.currentHp = 0;
        component.decreaseHP();
        expect(component.playerInfo.currentHp).toBe(0);
    });
});
