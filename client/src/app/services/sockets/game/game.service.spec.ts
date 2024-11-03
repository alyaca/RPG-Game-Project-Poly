import { TestBed } from '@angular/core/testing';
import { MAX_PLAYER_LARGE_MAP, MAX_PLAYER_MEDIUM_MAP, MAX_PLAYER_SMALL_MAP, SIZE_LARGE_MAP, SIZE_MEDIUM_MAP, SIZE_SMALL_MAP } from '@app/constants';
import { mockRoom } from '@app/mocks/mock-room';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;

    beforeEach(() => {
        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['send', 'on']);

        TestBed.configureTestingModule({ providers: [{ provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy }] });
        service = TestBed.inject(GameService);
    });

    it('should set roomId correctly', () => {
        const roomId = mockRoom.roomId;
        service.setRoomId(roomId);
        expect(service.roomId).toBe(roomId);
    });

    it('should join a room and set roomId and selectedGame', () => {
        socketCommunicationServiceSpy.on.and.callFake(<Room>(event: string, callback: (roomInfo: Room) => void) => {
            if (event === 'joinedRoom') {
                callback(mockRoom as Room);
            }
        });
        service.joinRoom(mockRoom.roomId);

        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('joinRoom', mockRoom.roomId);
        expect(service.isJoined).toBeTruthy();
        expect(service.selectedGame).toBe(mockRoom.gameMap);
        expect(service.roomId).toBe(mockRoom.roomId);
    });

    describe('getPlayerNumber', () => {
        it('should return max players for small map', () => {
            const result = service.getPlayerNumber(SIZE_SMALL_MAP);
            expect(result).toEqual(MAX_PLAYER_SMALL_MAP);
        });

        it('should return max players for medium map', () => {
            const result = service.getPlayerNumber(SIZE_MEDIUM_MAP);
            expect(result).toEqual(MAX_PLAYER_MEDIUM_MAP);
        });

        it('should return max players for large map', () => {
            const result = service.getPlayerNumber(SIZE_LARGE_MAP);
            expect(result).toEqual(MAX_PLAYER_LARGE_MAP);
        });

        it('should throw an error for invalid height', () => {
            const invalidHeight = 5;
            expect(() => service.getPlayerNumber(invalidHeight)).toThrowError('Nombre de joueur invalide');
        });
    });
});
