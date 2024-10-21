import { ACCESS_CODE_LENGTH } from '@app/constants';
import { mockGame } from '@app/mocks/mock-game';
import { mockRooms } from '@app/mocks/mock-room';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';

describe('RoomService', () => {
    let service: RoomService;
    let mockSocket: Socket;
    let mockServer: Server;
    let roomId: string;

    beforeEach(async () => {
        mockServer = {
            in: jest.fn().mockReturnValue({
                socketsLeave: jest.fn(),
            }),
            emit: jest.fn(),
            to: jest.fn().mockReturnThis(),
        } as unknown as Server;

        mockSocket = {
            broadcast: {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            },
            join: jest.fn(),
            leave: jest.fn(),
            data: { roomCode: '1234' },
            id: 'admin1234',
        } as unknown as Socket;

        const module: TestingModule = await Test.createTestingModule({
            providers: [RoomService],
        }).compile();

        service = module.get<RoomService>(RoomService);
        service['io'] = mockServer;
        roomId = '1234';
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should set the io server instance', () => {
        service.setServer(mockServer);
        expect(service['io']).toBe(mockServer);
    });

    describe('isRoomActive', () => {
        it('should return true if the room is active', () => {
            const mockRoom = mockRooms[0];
            service.rooms.set(roomId, mockRoom);
            const result = service.isRoomActive(roomId);
            expect(result).toBeTruthy();
        });

        it('should return false if the room is not active', () => {
            const result = service.isRoomActive(roomId);
            expect(result).toBeFalsy();
        });
    });

    describe('isPlayerAdmin', () => {
        it('should return true if the player is an admin', () => {
            service.adminList.push(mockSocket.id);
            const result = service.isPlayerAdmin(mockSocket);
            expect(result).toBe(true);
        });

        it('should return false if the player is not an admin', () => {
            const mockSocketPlayer = { id: '1564' } as Socket;
            const result = service.isPlayerAdmin(mockSocketPlayer);
            expect(result).toBe(false);
        });
    });

    describe('generate and get RoomCode', () => {
        it('should generate a numeric room code of the correct length', () => {
            const roomCode = service['generateRoomCode']();
            expect(roomCode).toHaveLength(ACCESS_CODE_LENGTH);
            expect(roomCode).toMatch(/^\d+$/);
        });

        it('should return a unique room code that is not already active', () => {
            service['generateRoomCode'] = jest.fn().mockReturnValue(roomId);
            jest.spyOn(service, 'isRoomActive').mockReturnValueOnce(true).mockReturnValueOnce(false);
            const roomCode = service['getNewRoomCode']();
            expect(roomCode).toBe('1234');
            expect(service.isRoomActive).toHaveBeenCalledTimes(2);
        });
    });

    describe('getRoomId', () => {
        it('should return roomCode if the room is active', () => {
            jest.spyOn(service, 'isRoomActive').mockReturnValue(true);
            const roomCode = service.getRoomId(mockSocket);
            expect(roomCode).toBe(mockSocket.data.roomCode);
        });

        it('should return null if the room is not active', () => {
            jest.spyOn(service, 'isRoomActive').mockReturnValue(false);
            const roomCode = service.getRoomId(mockSocket);
            expect(roomCode).toBe(null);
        });
    });

    it('should broadcast roomDeleted event, delete the room, and leave the room', () => {
        service['io'] = mockServer;
        service.rooms.set(roomId, mockRooms[0]);
        service.deleteRoom(roomId, mockSocket);

        expect(mockSocket.broadcast.to).toHaveBeenCalledWith(roomId);
        expect(service.rooms.has(roomId)).toBe(false);
        expect(mockServer.in).toHaveBeenCalledWith(roomId);
        expect(mockServer.in(roomId).socketsLeave).toHaveBeenCalledWith(roomId);
    });

    it('should not join if room is not active', () => {
        service.rooms.set(roomId, mockRooms[0]);
        jest.spyOn(service, 'isRoomActive').mockReturnValue(false);
        service.joinRoom(mockSocket, roomId);

        expect(mockSocket.join).not.toHaveBeenCalledWith(roomId);
    });

    it('should join if room is active', () => {
        service.rooms.set(roomId, mockRooms[0]);
        jest.spyOn(service, 'isRoomActive').mockReturnValue(true);
        service.joinRoom(mockSocket, roomId);

        expect(mockSocket.join).toHaveBeenCalledWith(roomId);
        expect(mockSocket.data.roomCode).toBeDefined();
    });

    describe('leaveRoom', () => {
        it('should return if socket is undefined', () => {
            service.leaveRoom(roomId, undefined);
            expect(mockServer.to).not.toHaveBeenCalled();
            expect(mockSocket.leave).not.toHaveBeenCalled();
        });

        it('should leave the room, and clear socket data if socket exists', () => {
            jest.spyOn(service, 'isPlayerAdmin').mockReturnValue(false);
            service.leaveRoom(roomId, mockSocket);

            expect(mockSocket.leave).toHaveBeenCalledWith(roomId);
            expect(mockSocket.data).toEqual({});
        });
    });

    it('should create a new room and join the socket to it', () => {
        service['getNewRoomCode'] = jest.fn().mockReturnValue(roomId);
        const room = service.createRoom(mockSocket, mockGame);

        expect(room).toEqual(mockRooms[0]);
        expect(mockSocket.join).toHaveBeenCalledWith(roomId);
        expect(mockSocket.data.roomCode).toEqual(roomId);
        expect(service.adminList).toContain(mockSocket.id);
    });

    it('should return the room corresponding to the client', () => {
        service.rooms.set(roomId, mockRooms[0]);
        jest.spyOn(service, 'getRoomId').mockReturnValue(roomId);

        const result = service.getRoom(mockSocket);

        expect(service.getRoomId).toHaveBeenCalled();
        expect(result).toBe(mockRooms[0]);
    });
});
