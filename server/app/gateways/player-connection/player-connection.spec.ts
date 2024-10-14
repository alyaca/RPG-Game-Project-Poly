import { mockGame } from '@app/mocks/mock-game';
import { mockRooms } from '@app/mocks/mock-room';
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
    let logger: SinonStubbedInstance<Logger>;

    beforeEach(async () => {
        const roomServiceMock = {
            setServer: jest.fn(),
            joinRoom: jest.fn(),
            createRoom: jest.fn(),
            leaveRoom: jest.fn(),
        };

        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);
        logger = createStubInstance(Logger);

        const module: TestingModule = await Test.createTestingModule({
            providers: [PlayerConnectionGateway, { provide: RoomService, useValue: roomServiceMock }, { provide: Logger, useValue: logger }],
        }).compile();

        gateway = module.get<PlayerConnectionGateway>(PlayerConnectionGateway);
        roomService = module.get<RoomService>(RoomService);
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
        const client = { id: 'test-client-id' } as Socket;
        jest.spyOn(logger, 'log');
        gateway.handleConnection(client);
        expect(logger.log).toHaveBeenCalledWith('Client connected: test-client-id');
    });

    it('should log when a client disconnects', () => {
        const client = { id: 'test-client-id' } as Socket;
        jest.spyOn(logger, 'log');
        gateway.handleDisconnect(client);
        expect(logger.log).toHaveBeenCalledWith('Client disconnected: test-client-id');
    });

    it('should call roomService joinRoom with the correct parameters', () => {
        const roomId = '1234';
        gateway.handleJoinRoom(socket, roomId);
        expect(roomService.joinRoom).toHaveBeenCalledWith(socket, roomId);
        expect(logger.log.calledOnce).toBeTruthy();
    });

    it('should call roomService createRoom, emit roomCreated, and log the event', () => {
        const room = mockRooms[0];
        (roomService.createRoom as jest.Mock).mockReturnValue(room);
        gateway.handleCreateRoom(socket as any, mockGame);

        expect(roomService.createRoom).toHaveBeenCalledWith(socket, mockGame);
        expect(socket.emit.calledWith('roomCreated', room)).toBeTruthy();
        expect(logger.log.calledOnce).toBeTruthy();
    });

    it('should call roomService leaveRoom and debug the event', () => {
        const roomId = '1234';
        gateway.handleLeaveRoom(socket, roomId);
        expect(roomService.leaveRoom).toHaveBeenCalledWith(roomId, socket);
        expect(logger.debug.calledOnce).toBeTruthy();
    });
});
