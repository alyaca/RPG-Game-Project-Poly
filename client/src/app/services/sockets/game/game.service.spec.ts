import { TestBed } from '@angular/core/testing';
import { mockRoom } from '@app/mocks/mock-room';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    let playerConnectionServiceSpy: jasmine.SpyObj<PlayerConnectionService>;

    beforeEach(() => {
        playerConnectionServiceSpy = jasmine.createSpyObj('PlayerConnectionService', ['send', 'on']);

        TestBed.configureTestingModule({ providers: [{ provide: PlayerConnectionService, useValue: playerConnectionServiceSpy }] });
        service = TestBed.inject(GameService);
    });

    it('should set roomId correctly', () => {
        const roomId = mockRoom.roomId;
        service.setRoomId(roomId);
        expect(service.roomId).toBe(roomId);
    });

    it('should join a room and set roomId and selectedGame', () => {
        playerConnectionServiceSpy.on.and.callFake(<Room>(event: string, callback: (roomInfo: Room) => void) => {
            if (event === 'joinedRoom') {
                callback(mockRoom as Room);
            }
        });
        service.joinRoom(mockRoom.roomId);

        expect(playerConnectionServiceSpy.send).toHaveBeenCalledWith('joinRoom', mockRoom.roomId);
        expect(service.isJoined).toBeTruthy();
        expect(service.selectedGame).toBe(mockRoom.gameMap);
        expect(service.roomId).toBe(mockRoom.roomId);
    });
});
