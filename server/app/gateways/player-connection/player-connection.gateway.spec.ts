import { mockGame } from '@app/mocks/mock-game';
import { mockRooms } from '@app/mocks/mock-room';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { avatars } from '@common/avatars-info';
import { Player, Status } from '@common/player';
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
    let mockPlayer: Player;

    beforeEach(async () => {
        const roomServiceMock = {
            setServer: jest.fn(),
            joinRoom: jest.fn(),
            createRoom: jest.fn(),
            leaveRoom: jest.fn(),
            isPlayerAdmin: jest.fn(),
            deleteRoom: jest.fn(),
            getRoom: jest.fn(),
            getRoomId: jest.fn(),
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
        mockClient = {
            emit: jest.fn(),
            to: jest.fn().mockReturnValue({ emit: jest.fn() }),
            id: 'test-client-id',
            data: { roomCode: roomId },
        } as unknown as Socket;

        mockPlayer = {
            id: '',
            name: 'Test Player',
            status: Status.Player,
        } as Player;

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
        gateway.handleConnection(socket);
        expect(logger.log).toHaveBeenCalled();
    });

    it('should log when a client disconnects', () => {
        (roomService.getRoom as jest.Mock).mockReturnValue(mockRooms[0]);
        jest.spyOn(gameService, 'leavePlayerFromGame');
        jest.spyOn(logger, 'log');
        gateway.handleDisconnect(socket);
        expect(gameService.leavePlayerFromGame).toHaveBeenCalled();
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
            expect(logger.debug).not.toHaveBeenCalled();
        });

        it('should leave room if connectionRes has errorType roomLocked', () => {
            const connectionRes = { event: 'joinError', errorType: 'roomLocked' };
            (gameService.connectPlayerToGame as jest.Mock).mockReturnValue(connectionRes);
            gateway.handleJoinRoom(mockClient, roomId);

            expect(mockClient.emit).toHaveBeenCalledWith(connectionRes.event, connectionRes.errorType);
            expect(logger.debug).not.toHaveBeenCalled();
        });

        it('should join the room successfully when there is no error', () => {
            const connectionRes = { event: 'joinedRoom' };
            (gameService.connectPlayerToGame as jest.Mock).mockReturnValue(connectionRes);
            gateway.handleJoinRoom(mockClient, roomId);

            expect(mockClient.emit).toHaveBeenCalledWith(connectionRes.event, mockRooms[0]);
            expect(roomService.joinRoom).toHaveBeenCalledWith(mockClient, roomId);
            expect(logger.debug).toHaveBeenCalled();
        });
    });

    it('should call roomService createRoom, emit roomCreated, and log the event', () => {
        const room = mockRooms[0];
        (roomService.createRoom as jest.Mock).mockReturnValue(room);
        gateway.handleCreateRoom(socket as Socket, mockGame);

        expect(roomService.createRoom).toHaveBeenCalledWith(socket, mockGame);
        expect(socket.emit.calledWith('roomCreated', room)).toBeTruthy();
        expect(logger.log.calledOnce).toBeTruthy();
    });

    it('should call gameService leavePlayerFromGame on leaveRoom event', () => {
        jest.spyOn(gameService, 'leavePlayerFromGame');
        gateway.handleLeaveRoom(socket, roomId);
        expect(gameService.leavePlayerFromGame).toHaveBeenCalled();
        expect(logger.debug.calledOnce).toBeTruthy();
    });

    it('should call getRoom and selectedAvatar on selectCharacter event', () => {
        jest.spyOn(roomService, 'getRoom');
        jest.spyOn(gameService, 'selectedAvatar');
        gateway.handleSelectCharacter(socket, avatars[0]);
        expect(roomService.getRoom).toHaveBeenCalled();
        expect(gameService.selectedAvatar).toHaveBeenCalled();
    });

    it('should call getRoomId and toggleLockRoom on changeLockRoom event', () => {
        const data = { isLocked: false };
        jest.spyOn(roomService, 'getRoomId');
        jest.spyOn(gameService, 'toggleLockRoom');
        gateway.handleLockRoom(socket, data);
        expect(roomService.getRoomId).toHaveBeenCalled();
        expect(gameService.toggleLockRoom).toHaveBeenCalled();
    });

    it('should call getRoom and emit on isLocked event', () => {
        (roomService.getRoom as jest.Mock).mockReturnValue(mockRooms[0]);
        gateway.handleIsRoomLocked(socket);
        expect(roomService.getRoom).toHaveBeenCalled();
        expect(socket.emit).toBeTruthy();
    });

    describe('handleCreatePlayer', () => {
        it('should create a player and emit updatedPlayer events', () => {
            const room = mockRooms[0];
            (roomService.getRoom as jest.Mock).mockReturnValue(room);

            jest.spyOn(gameService, 'createPlayer');
            room.listPlayers.push(mockPlayer);

            gateway.handleCreatePlayer(mockClient, mockPlayer);

            expect(roomService.getRoom).toHaveBeenCalledWith(mockClient);
            expect(gameService.createPlayer).toHaveBeenCalledWith(room, mockPlayer, mockClient);
            expect(mockClient.emit).toHaveBeenCalledWith('updatedPlayer', room);
            expect(mockClient.to(room.roomId).emit).toHaveBeenCalledWith('updatedPlayer', room);
        });
    });
});
