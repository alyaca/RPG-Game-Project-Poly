import { ACCESS_CODE_LENGTH } from '@app/constants';
import { mockGame } from '@app/mocks/mock-game';
import { mockRooms } from '@app/mocks/mock-room';
import { PathRoute } from '@common/route';
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
            const adminId = 'admin-socket-id';
            service.adminList.push(adminId);
            const mockSocket = { id: adminId } as Socket;
            const result = service.isPlayerAdmin(mockSocket);

            expect(result).toBe(true);
        });

        it('should return false if the player is not an admin', () => {
            const adminId = 'non-admin-socket-id';
            const mockSocket = { id: adminId } as Socket;
            const result = service.isPlayerAdmin(mockSocket);
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
            jest.spyOn(service as any, 'generateRoomCode').mockReturnValue('1234');
            jest.spyOn(service, 'isRoomActive').mockReturnValueOnce(true).mockReturnValueOnce(false);

            const roomCode = service['getNewRoomCode']();
            expect(roomCode).toBe('1234');
            expect(service.isRoomActive).toHaveBeenCalledTimes(2);
        });
    });

    describe('getRoomId', () => {
        it('should return roomCode if the room is active', () => {
            jest.spyOn(service, 'isRoomActive').mockReturnValue(true);
            const roomId = service.getRoomId(mockSocket);
            expect(roomId).toBe(mockSocket.data.roomCode);
        });

        it('should return null if the room is not active', () => {
            jest.spyOn(service, 'isRoomActive').mockReturnValue(false);
            const roomId = service.getRoomId(mockSocket);
            expect(roomId).toBe(null);
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

    describe('joinRoom', () => {
        it('should join the room and emit joinedRoom event if room is active', () => {
            service['io'] = mockServer;
            service.rooms.set(roomId, mockRooms[0]);
            jest.spyOn(service, 'isRoomActive').mockReturnValue(true);
            service.joinRoom(mockSocket, roomId);

            expect(mockSocket.join).toHaveBeenCalledWith(roomId);
            expect(mockServer.to(roomId).emit).toHaveBeenCalledWith('joinedRoom', mockRooms[0]);
        });

        it('should emit joinError event if room is not active', () => {
            service['io'] = mockServer;
            service.rooms.set(roomId, mockRooms[0]);
            jest.spyOn(service, 'isRoomActive').mockReturnValue(false);
            service.joinRoom(mockSocket, roomId);

            expect(mockSocket.join).not.toHaveBeenCalledWith(roomId);
            expect(mockServer.emit).toHaveBeenCalledWith('joinError');
        });
    });

    describe('leaveRoom', () => {
        it('should return if socket is undefined', () => {
            service.leaveRoom(roomId, undefined);
            expect(mockServer.to).not.toHaveBeenCalled();
            expect(mockSocket.leave).not.toHaveBeenCalled();
        });

        it('should emit leftRoom event with PathRoute.CREATE and delete the room if socket is an admin', () => {
            jest.spyOn(service, 'isPlayerAdmin').mockReturnValue(true);
            const spy = jest.spyOn(service, 'deleteRoom');
            service.leaveRoom(roomId, mockSocket);

            expect(mockServer.to).toHaveBeenCalledWith(roomId);
            expect(mockServer.emit).toHaveBeenCalledWith('leftRoom', PathRoute.CREATE);
            expect(spy).toHaveBeenCalledWith(roomId, mockSocket);
        });

        it('should emit leftRoom event with PathRoute.HOME, leave the room, and clear socket data if socket is not an admin', () => {
            jest.spyOn(service, 'isPlayerAdmin').mockReturnValue(false);
            service.leaveRoom(roomId, mockSocket);

            expect(mockServer.to).toHaveBeenCalledWith(roomId);
            expect(mockServer.emit).toHaveBeenCalledWith('leftRoom', PathRoute.HOME);
            expect(mockSocket.leave).toHaveBeenCalledWith(roomId);
            expect(mockSocket.data).toEqual({});
        });
    });

    it('should create a new room and join the socket to it', () => {
        jest.spyOn(service as any, 'getNewRoomCode').mockReturnValue(roomId);
        const room = service.createRoom(mockSocket, mockGame);

        expect(room).toEqual(mockRooms[0]);
        expect(service.rooms.get(roomId)).toEqual(room);
        expect(mockSocket.join).toHaveBeenCalledWith(roomId);
        expect(mockSocket.data.roomCode).toEqual(roomId);
        expect(service.adminList).toContain(mockSocket.id);
    });
});
