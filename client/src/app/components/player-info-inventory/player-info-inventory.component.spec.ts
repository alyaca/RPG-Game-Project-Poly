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
        expect(component.playerInfo.statsAndInventory.movementPointsLeft).toBe(mockPlayer.statsAndInventory.movementPointsLeft);

        component.decreaseMovement();
        expect(component.playerInfo.statsAndInventory.movementPointsLeft).toBe(mockPlayer.statsAndInventory.movementPointsLeft);
    });

    it('should not update the movement points if you already have max or minimum value for it', () => {
        component.playerInfo.statsAndInventory.movementPointsLeft = mockPlayer.statsAndInventory.speed;
        component.increaseMovement();
        expect(component.playerInfo.statsAndInventory.movementPointsLeft).toBe(mockPlayer.statsAndInventory.speed);

        component.playerInfo.statsAndInventory.movementPointsLeft = 0;
        component.decreaseMovement();
        expect(component.playerInfo.statsAndInventory.movementPointsLeft).toBe(0);
    });

    it('should update the action points', () => {
        component.playerInfo.statsAndInventory.actionPoints = mockPlayer.statsAndInventory.actionPoints;
        component.increaseActionPoints();
        expect(component.playerInfo.statsAndInventory.actionPoints).toBe(mockPlayer.statsAndInventory.actionPoints + 1);

        component.decreaseActionPoints();
        expect(component.playerInfo.statsAndInventory.actionPoints).toBe(mockPlayer.statsAndInventory.actionPoints);
    });

    it('should not update the action points value if it is already at the max or min', () => {
        component.playerInfo.statsAndInventory.actionPoints = mockPlayer.statsAndInventory.maxActionPoints;
        component.playerInfo.statsAndInventory.maxActionPoints = mockPlayer.statsAndInventory.maxActionPoints;
        component.increaseActionPoints();
        expect(component.playerInfo.statsAndInventory.actionPoints).toBe(mockPlayer.statsAndInventory.maxActionPoints);

        component.playerInfo.statsAndInventory.actionPoints = 0;
        component.decreaseActionPoints();
        expect(component.playerInfo.statsAndInventory.actionPoints).toBe(0);
    });

    it('should update the hp value', () => {
        component.playerInfo.statsAndInventory.currentHp = mockPlayer.statsAndInventory.currentHp;
        component.increaseHP();
        expect(component.playerInfo.statsAndInventory.currentHp).toBe(mockPlayer.statsAndInventory.currentHp + 1);

        component.decreaseHP();
        expect(component.playerInfo.statsAndInventory.currentHp).toBe(mockPlayer.statsAndInventory.currentHp);
    });

    it('should not update the hp value if already at max or min', () => {
        component.playerInfo.statsAndInventory.hp = mockPlayer.statsAndInventory.hp;
        component.playerInfo.statsAndInventory.currentHp = mockPlayer.statsAndInventory.hp;
        component.increaseHP();
        expect(component.playerInfo.statsAndInventory.currentHp).toBe(component.playerInfo.statsAndInventory.hp);

        component.playerInfo.statsAndInventory.currentHp = 0;
        component.decreaseHP();
        expect(component.playerInfo.statsAndInventory.currentHp).toBe(0);
    });
});
