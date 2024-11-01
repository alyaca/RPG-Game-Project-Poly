import { ComponentFixture, TestBed } from '@angular/core/testing';

import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { PlayerInfoInventoryComponent } from './player-info-inventory.component';

describe('PlayerInfoInventoryComponent', () => {
    let component: PlayerInfoInventoryComponent;
    let fixture: ComponentFixture<PlayerInfoInventoryComponent>;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;

    beforeEach(async () => {
        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['on']);
        await TestBed.configureTestingModule({
            imports: [PlayerInfoInventoryComponent],
            providers: [{ provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayerInfoInventoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.player = mockLobbyPlayers[0];
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update the movement value', () => {
        component.player = mockLobbyPlayers[0];
        component.increaseMovement();
        expect(component.player.attributes.movementPointsLeft).toBe(mockLobbyPlayers[0].attributes.movementPointsLeft);

        component.decreaseMovement();
        expect(component.player.attributes.movementPointsLeft).toBe(mockLobbyPlayers[0].attributes.movementPointsLeft);
    });

    it('should not update the movement points if you already have max or minimum value for it', () => {
        component.player = mockLobbyPlayers[0];
        component.player.attributes.movementPointsLeft = component.player.attributes.speed;
        component.increaseMovement();
        expect(component.player.attributes.movementPointsLeft).toBe(mockLobbyPlayers[0].attributes.speed);

        component.player.attributes.movementPointsLeft = 0;
        component.decreaseMovement();
        expect(component.player.attributes.movementPointsLeft).toBe(0);
    });

    it('should update the action points', () => {
        component.player = mockLobbyPlayers[0];
        // component.player.attributes.actionPoints = mockLobbyPlayers[0].attributes.actionPoints;
        component.increaseActionPoints();
        expect(component.player.attributes.actionPoints).toBe(5);

        component.decreaseActionPoints();
        expect(component.player.attributes.actionPoints).toBe(4);
    });

    it('should not update the action points value if it is already at the max or min', () => {
        component.player.attributes.actionPoints = mockLobbyPlayers[0].attributes.maxActionPoints;
        component.player.attributes.maxActionPoints = mockLobbyPlayers[0].attributes.maxActionPoints;
        component.increaseActionPoints();
        expect(component.player.attributes.actionPoints).toBe(mockLobbyPlayers[0].attributes.maxActionPoints);

        component.player.attributes.actionPoints = 0;
        component.decreaseActionPoints();
        expect(component.player.attributes.actionPoints).toBe(0);
    });

    it('should update the totalHp value', () => {
        component.player.attributes.currentHp = mockLobbyPlayers[0].attributes.currentHp - 1;
        component.increaseHP();
        expect(component.player.attributes.currentHp).toBe(mockLobbyPlayers[0].attributes.currentHp);

        component.decreaseHP();
        expect(component.player.attributes.currentHp).toBe(mockLobbyPlayers[0].attributes.currentHp - 1);
    });

    it('should not update the totalHp value if already at max or min', () => {
        component.player.attributes.totalHp = mockLobbyPlayers[0].attributes.totalHp;
        component.player.attributes.currentHp = mockLobbyPlayers[0].attributes.totalHp;
        component.increaseHP();
        expect(component.player.attributes.currentHp).toBe(component.player.attributes.totalHp);

        component.player.attributes.currentHp = 0;
        component.decreaseHP();
        expect(component.player.attributes.currentHp).toBe(0);
    });
});
