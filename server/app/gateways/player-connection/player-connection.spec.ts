import { mockGame } from '@app/mocks/mock-game';
import { mockRooms } from '@app/mocks/mock-room';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Server, Socket } from 'socket.io';
import { PlayerConnectionGateway } from './player-connection.gateway';

describe('PlayerConnectionGateway', () => {
    let gateway: PlayerConnectionGateway;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let roomService: RoomService;
    let gameService: GameService;
    let logger: SinonStubbedInstance<Logger>;
    let roomId: string;
    let mockClient: Socket;

    beforeEach(async () => {
        const roomServiceMock = {
            setServer: jest.fn(),
            joinRoom: jest.fn(),
            createRoom: jest.fn(),
            leaveRoom: jest.fn(),
            isPlayerAdmin: jest.fn(),
            deleteRoom: jest.fn(),
            getRoom: jest.fn(),
            rooms: new Map(),
        };

        const gameServiceMock = {
            connectPlayerToGame: jest.fn(),
            leavePlayerFromGame: jest.fn(),
            toggleLockRoom: jest.fn(),
            createPlayer: jest.fn(),
            selectedAvatar: jest.fn(),
        };
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);
        logger = createStubInstance(Logger);
        roomId = '1234';
        mockClient = { emit: jest.fn(), id: 'test-client-id', data: { roomCode: roomId } } as unknown as Socket;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PlayerConnectionGateway,
                { provide: RoomService, useValue: roomServiceMock },
                { provide: Logger, useValue: logger },
                { provide: GameService, useValue: gameServiceMock },
            ],
        }).compile();

        gateway = module.get<PlayerConnectionGateway>(PlayerConnectionGateway);
        roomService = module.get<RoomService>(RoomService);
        gameService = module.get<GameService>(GameService);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should call setServer on roomService when onModuleInit is called', () => {
        gateway['server'] = server;
        gateway.onModuleInit();
        expect(roomService.setServer).toHaveBeenCalledWith(server);
    });

    it('should log when a client connects', () => {
        jest.spyOn(logger, 'log');
        gateway.handleConnection(mockClient);
        expect(logger.log).toHaveBeenCalled();
    });

    it('should log when a client disconnects', () => {
        (roomService.getRoom as jest.Mock).mockReturnValue(mockRooms[0]);
        jest.spyOn(gameService, 'leavePlayerFromGame');
        jest.spyOn(logger, 'log');
        gateway.handleDisconnect(mockClient);
        expect(gameService.leavePlayerFromGame).toHaveBeenCalledWith(roomId, mockClient);
        expect(logger.log).toHaveBeenCalled();
    });

    describe('joinRoom', () => {
        beforeEach(() => {
            roomService.rooms.set(roomId, mockRooms[0]);
            jest.spyOn(roomService, 'joinRoom');
            jest.spyOn(logger, 'debug');
        });
        it('should leave room if connectionRes has errorType roomNotFound', () => {
            const connectionRes = { event: 'joinError', errorType: 'roomNotFound' };
            (gameService.connectPlayerToGame as jest.Mock).mockReturnValue(connectionRes);
            gateway.handleJoinRoom(mockClient, roomId);

            expect(mockClient.emit).toHaveBeenCalledWith(connectionRes.event, connectionRes.errorType);
            expect(mockClient.emit).toHaveBeenCalled();
            expect(logger.debug).not.toHaveBeenCalled();
        });

        it('should leave room if connectionRes has errorType roomLocked', () => {
            const connectionRes = { event: 'joinedRoom' };
            (gameService.connectPlayerToGame as jest.Mock).mockReturnValue(connectionRes);
            gateway.handleJoinRoom(mockClient, roomId);

            expect(mockClient.emit).toHaveBeenCalledWith(connectionRes.event, mockRooms[0]);
            expect(roomService.joinRoom).toHaveBeenCalledWith(mockClient, roomId);
            expect(logger.debug).toHaveBeenCalled();
        });

        it('should join the room successfully when there is no error', () => {
            const connectionRes = { event: 'joinError', errorType: 'roomLocked' };
        });

        // it('should call roomService joinRoom with the correct parameters', () => {
        //     const roomId = '1234';
        //     roomService.rooms.set('3244', mockRooms[0]);
        //     gateway.handleJoinRoom(socket, roomId);
        //     expect(roomService.joinRoom).toHaveBeenCalledWith(socket, roomId);
        //     expect(logger.debug.calledOnce).toBeTruthy();
        // });
        // it('should join the room and emit joinedRoom event if room is active', () => {
        //     service['io'] = mockServer;
        //     service.rooms.set(roomId, mockRooms[0]);
        //     jest.spyOn(service, 'isRoomActive').mockReturnValue(true);
        //     service.joinRoom(mockSocket, roomId);
        //     expect(mockSocket.join).toHaveBeenCalledWith(roomId);
        //     expect(mockServer.to(roomId).emit).toHaveBeenCalledWith('joinedRoom', mockRooms[0]);
        // });
    });

    it('should call roomService createRoom, emit roomCreated, and log the event', () => {
        const room = mockRooms[0];
        (roomService.createRoom as jest.Mock).mockReturnValue(room);
        gateway.handleCreateRoom(socket as Socket, mockGame);

        expect(roomService.createRoom).toHaveBeenCalledWith(socket, mockGame);
        expect(socket.emit.calledWith('roomCreated', room)).toBeTruthy();
        expect(logger.log.calledOnce).toBeTruthy();
    });

    it('should call gameService leavePlayerFromGame when leaveRoom is received', () => {
        const roomId = '1234';
        jest.spyOn(gameService, 'leavePlayerFromGame');

        gateway.handleLeaveRoom(socket, roomId);
        expect(gameService.leavePlayerFromGame).toHaveBeenCalled();
        expect(logger.debug.calledOnce).toBeTruthy();
    });
});
