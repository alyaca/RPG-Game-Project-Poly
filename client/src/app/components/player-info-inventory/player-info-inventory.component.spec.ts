import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DEFAULT_ATTRIBUTE } from '@app/constants';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { mockPlayer } from '@app/mocks/mock-player';
import { mockInventoryPlayer, mockInventoryPlayerWithXiphos, mockPlayers } from '@app/mocks/mock-players';
import { mockRoom } from '@app/mocks/mock-room';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { PlayerInfoInventoryComponent } from './player-info-inventory.component';
import { Attributes, Player } from '@common/interfaces/player';
import { ServerToClientEvent } from '@common/socket.events';

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
        component.healthBar = new ElementRef(document.createElement('progress'));
        component.playerId = mockPlayer.id.toString();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update movementPointsArray when UpdateAllPlayers event is triggered', () => {
        const mockPlayerList = [{ id: component.player.id, attributes: { movementPointsLeft: 1 } } as Player];

        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === ServerToClientEvent.UpdateAllPlayers) {
                callback(mockPlayerList as T);
            }
        });
        component.player = mockInventoryPlayer;
        component.ngOnInit();
        expect(component.movementPointsArray).toEqual(Array(1));
    });

    describe('getActionArray', () => {
        it('should return empty array if actionPoints is negative', () => {
            component.activePlayer = { id: 'matchingId', attributes: { actionPoints: -1 } } as Player;
            component.player.attributes = { actionPoints: 0 } as Attributes;
            component.player.id = 'matchingId';
            const result = component.getActionArray();
            expect(result).toEqual([]);
        });
        it('should return the correct action array for the current player', () => {
            component.activePlayer = { id: 'someOtherId', attributes: { actionPoints: 2 } } as Player;
            component.player.attributes = { actionPoints: 2 } as Attributes;
            const result = component.getActionArray();
            expect(result).toEqual(Array(2));
        });
    });

    it('should get the good number of empty slots', () => {
        component.player = mockInventoryPlayer;
        expect(component.emptySlots).toEqual([]);

        component.player = mockPlayers[0];
        expect(component.emptySlots).toEqual([0, 0]);
    });

    it('should return the correct value for hasXiphos', () => {
        expect(component.hasXiphos(mockInventoryPlayer)).toBeUndefined();
        expect(component.hasXiphos(mockInventoryPlayerWithXiphos)).toBeDefined();
    });

    it('should update the movement value', () => {
        component.player = mockLobbyPlayers[0];
        component.player.attributes.movementPointsLeft = 1;
        component.increaseMovement();
        expect(component.player.attributes.movementPointsLeft).toBe(mockLobbyPlayers[0].attributes.movementPointsLeft);

        component.decreaseMovement();
        expect(component.player.attributes.movementPointsLeft).toBe(mockLobbyPlayers[0].attributes.movementPointsLeft);
    });

    it('should set the info on updateInventory', () => {
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'updateInventory') {
                callback(mockInventoryPlayer as T);
            }
        });
        component.player = mockInventoryPlayer;
        component.ngOnInit();
        expect(component.player.attributes).toEqual(mockInventoryPlayer.attributes);
        expect(component.player.inventory).toEqual(mockInventoryPlayer.inventory);
        expect(component.player.attributes.currentHp).toEqual(mockInventoryPlayer.attributes.totalHp);
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
        const initialActionPoints = 2;
        component.player = mockLobbyPlayers[0];
        component.player.attributes.actionPoints = initialActionPoints;
        component.increaseActionPoints();
        expect(component.player.attributes.actionPoints).toBe(initialActionPoints + 1);

        component.decreaseActionPoints();
        expect(component.player.attributes.actionPoints).toBe(initialActionPoints);
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
        component.player = mockLobbyPlayers[0];
        component.player.attributes.currentHp = 1;
        component.increaseHP();
        expect(component.player.attributes.currentHp).toBe(2);

        component.decreaseHP();
        expect(component.player.attributes.currentHp).toBe(1);
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

    it('should subscribe to mapInformation and update player data', () => {
        component.playerId = mockLobbyPlayers[0].id;
        const room = mockRoom;
        room.listPlayers = mockLobbyPlayers;

        socketCommunicationServiceSpy.on.and.callFake(<Room>(event: string, callback: (data: Room) => void) => {
            if (event === 'mapInformation') {
                callback(mockRoom as Room);
            }
        });

        component.ngOnInit();

        expect(component.player).toEqual(mockLobbyPlayers[0]);
        expect(component.movementPointsArray).toEqual(Array(mockLobbyPlayers[0].attributes.speed));
    });

    it('should not increase movement points if they are equal to speed', () => {
        component.player.attributes.movementPointsLeft = component.player.attributes.speed;

        component.increaseMovement();

        expect(component.player.attributes.movementPointsLeft).toBe(component.player.attributes.speed);
    });

    it('should increase movement points and update movementPointsArray if movementPointsLeft is less than speed', () => {
        component.player.attributes.movementPointsLeft = DEFAULT_ATTRIBUTE - 1;
        const initialMovementPoints = component.player.attributes.movementPointsLeft;

        component.increaseMovement();

        expect(component.player.attributes.movementPointsLeft).toBe(initialMovementPoints + 1);
    });
});
