import { IMessage } from '@app/interfaces/message.interface';
import { DoorActionData } from '@app/interfaces/socket-data.interface';
import { mockGame } from '@app/mocks/mock-game';
import { mockPlayers } from '@app/mocks/mock-players';
import { mockRoom, mockRoomDebug, mockRooms } from '@app/mocks/mock-room';
import { ChatService } from '@app/services/chat/chat.service';
import { CombatService } from '@app/services/combat/combat.service';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { avatars } from '@common/avatars-info';
import { Behavior, Player } from '@common/player';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Server, Socket } from 'socket.io';
import { SocketGateway } from './socket.gateway';

/* eslint-disable max-lines */
describe('SocketGateway', () => {
    let gateway: SocketGateway;
    let socket: jest.Mocked<Socket>;
    let server: jest.Mocked<Server>;
    let roomService: RoomService;
    let gameService: GameService;
    let chatService: ChatService;
    let logger: SinonStubbedInstance<Logger>;
    let roomId: string;
    let mockClient: Socket;
    let mockPlayer: Player;
    let combatService: CombatService;

    beforeEach(async () => {
        const chatServiceMock = {
            saveMessage: jest.fn(),
            getMessagesByRoom: jest.fn(),
        };

        const combatServiceMock = {
            startFight: jest.fn(),
            attackPlayer: jest.fn(),
            isInCombat: jest.fn(),
            disconnectedPlayer: jest.fn(),
        };

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
            createBot: jest.fn(),
            selectedAvatar: jest.fn(),
            onKickPlayer: jest.fn(),
            onKickBot: jest.fn(),
            onStartGame: jest.fn(),
            removePlayerFromRoom: jest.fn(),
            stopGameTimers: jest.fn(),
            getActivePlayer: jest.fn(),
            onTurnEnded: jest.fn(),
            onStartTurn: jest.fn(),
            processNavigation: jest.fn(),
            assignAvatarToBot: jest.fn(),
            assignStatsToBot: jest.fn(),
            updateAvatarsForAllClients: jest.fn(),
            updateLogsDebugMode: jest.fn(),
            processTeleportation: jest.fn(),
            handleDoor: jest.fn(),
        };

        socket = {
            emit: jest.fn(),
            to: jest.fn().mockReturnValue({ emit: jest.fn() }),
            data: {},
        } as unknown as jest.Mocked<Socket>;

        const broadcastOperator = {
            emit: jest.fn(),
        };

        server = {
            to: jest.fn().mockReturnValue(broadcastOperator),
            sockets: {
                sockets: new Map(),
                adapter: {
                    rooms: new Map(),
                },
            },
        } as unknown as jest.Mocked<Server>;

        logger = createStubInstance(Logger);
        roomId = '1234';
        mockClient = {
            emit: jest.fn(),
            to: jest.fn().mockReturnValue({ emit: jest.fn() }),
            id: 'test-client-id',
            data: { roomCode: roomId },
        } as unknown as Socket;

        mockPlayer = mockPlayers[0];

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SocketGateway,
                { provide: RoomService, useValue: roomServiceMock },
                { provide: Logger, useValue: logger },
                { provide: GameService, useValue: gameServiceMock },
                { provide: ChatService, useValue: chatServiceMock },
                { provide: CombatService, useValue: combatServiceMock },
            ],
        }).compile();

        gateway = module.get<SocketGateway>(SocketGateway);
        roomService = module.get<RoomService>(RoomService);
        gameService = module.get<GameService>(GameService);
        chatService = module.get<ChatService>(ChatService);
        combatService = module.get<CombatService>(CombatService);
        gateway['server'] = server;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should call setServer on roomService when onModuleInit is called', () => {
        gateway.onModuleInit();
        expect(roomService.setServer).toHaveBeenCalledWith(server);
    });

    it('should log when a client connects', () => {
        jest.spyOn(logger, 'log');
        gateway.handleConnection(socket);
        expect(logger.log).toHaveBeenCalled();
    });

    describe('disconnect', () => {
        it('should log when a client disconnects', () => {
            (roomService.getRoom as jest.Mock).mockReturnValue(mockRooms[0]);
            (combatService.isInCombat as jest.Mock).mockReturnValue(true);
            jest.spyOn(combatService, 'disconnectedPlayer');
            jest.spyOn(gameService, 'leavePlayerFromGame');
            jest.spyOn(logger, 'log');
            gateway.handleDisconnect(socket);
            expect(gameService.leavePlayerFromGame).toHaveBeenCalled();
            expect(logger.log).toHaveBeenCalled();
        });
        it('should log when a client disconnects and is not in a room', () => {
            jest.spyOn(logger, 'log');
            gateway.handleDisconnect(socket);
            expect(logger.log).toHaveBeenCalledWith(`Client disconnected but was not in a room: ${socket.id}`);
        });
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
        expect(socket.emit).toHaveBeenCalledWith('roomCreated', room);
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
        const isLocked = false;
        jest.spyOn(roomService, 'getRoomId');
        jest.spyOn(gameService, 'toggleLockRoom');
        gateway.handleLockRoom(socket, isLocked);
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
            (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(false);

            jest.spyOn(gameService, 'createPlayer');
            room.listPlayers.push(mockPlayer);

            gateway.handleCreatePlayer(mockClient, mockPlayer);

            expect(roomService.getRoom).toHaveBeenCalledWith(mockClient);
            expect(roomService.isPlayerAdmin).toHaveBeenCalled();
            expect(gameService.createPlayer).toHaveBeenCalledWith(room, mockPlayer, mockClient);
            expect(mockClient.emit).toHaveBeenCalledWith('isPlayerAdmin', false);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith('updatedPlayer', room);
        });
    });

    describe('handleKickPlayer', () => {
        it('should call onkickplayer on kickPlayer event', () => {
            gameService.onKickPlayer = jest.fn();
            gateway.handleKickPlayer(socket, mockPlayer.id);

            expect(gameService.onKickPlayer).toHaveBeenCalled();
        });
    });

    describe('handleStartGame', () => {
        it('should call processMapObjects and onStartGame startGame event', () => {
            jest.spyOn(gameService, 'onStartGame');
            gateway.handleStartGame(socket);
            expect(gameService.onStartGame).toHaveBeenCalledWith(socket, server);
        });
    });

    it('should call onTurnEnded endTurn event', () => {
        jest.spyOn(gameService, 'onTurnEnded');
        jest.spyOn(logger, 'debug');

        gateway.handleEndTurn(socket);
        expect(gameService.onTurnEnded).toHaveBeenCalled();
        expect(logger.debug).toHaveBeenCalledWith(`client ${socket.id} turn is over`);
    });

    it('should call onStartTurn startTurn event', () => {
        jest.spyOn(gameService, 'onStartTurn');
        gateway.handleBeforeStartTurn(socket);
        expect(gameService.onStartTurn).toHaveBeenCalled();
    });

    describe('handleMessage', () => {
        it('should handle sending and saving a message successfully', async () => {
            const spyOnSaveMessage = jest.spyOn(gateway, 'saveMessage');
            jest.spyOn(logger, 'log');

            socket.data.username = 'Luffy';
            socket.data.roomCode = roomId;

            const mockMessageData: IMessage = {
                roomId,
                username: socket.data.username,
                message: 'I am going to be the Pirate King!',
                timestamp: new Date(),
            };

            (chatService.saveMessage as jest.Mock).mockResolvedValue(mockMessageData);
            (roomService.getRoomId as jest.Mock).mockReturnValue(roomId);

            await gateway.handleMessage(socket, mockMessageData);

            expect(logger.log).toHaveBeenCalled();
            expect(spyOnSaveMessage).toHaveBeenCalledWith(socket, mockMessageData);
            expect(chatService.saveMessage).toHaveBeenCalledWith(mockMessageData);
            expect(roomService.getRoomId).toHaveBeenCalledWith(socket);
            expect(server.to).toHaveBeenCalledWith(roomId);

            const broadcastOperator = server.to(roomId);
            expect(broadcastOperator.emit).toHaveBeenCalledWith('messageReceived', mockMessageData);
        });

        it('should emit an errorMessage on saveMessage failure', async () => {
            const spyOnSaveMessage = jest.spyOn(gateway, 'saveMessage');
            jest.spyOn(logger, 'error');

            socket.data.username = 'Vegeta';
            socket.data.roomCode = roomId;
            const mockMessageData: IMessage = {
                roomId,
                username: socket.data.username,
                message: 'I am the prince of all Saiyans!',
                timestamp: new Date(),
            };

            const failedMessage = 'Save failed';
            (roomService.getRoomId as jest.Mock).mockReturnValue(roomId);
            (chatService.saveMessage as jest.Mock).mockRejectedValue(new Error(failedMessage));

            await gateway.handleMessage(socket, mockMessageData);

            expect(roomService.getRoomId).toHaveBeenCalledWith(socket);
            expect(spyOnSaveMessage).toHaveBeenCalledWith(socket, mockMessageData);
            expect(chatService.saveMessage).toHaveBeenCalledWith(mockMessageData);
            expect(logger.error).toHaveBeenCalled();
            expect(socket.emit).toHaveBeenCalledWith('errorMessage', 'Failed to send message.');
        });
    });

    it('should call processNavigation playerNavigation event', () => {
        (roomService.getRoom as jest.Mock).mockReturnValue(mockRooms[0]);
        jest.spyOn(gameService, 'processNavigation');
        const path = [{ x: 1, y: 2 }];
        gateway.handlePlayerNavigation(mockClient, path);
        expect(gameService.processNavigation).toHaveBeenCalled();
    });

    it('should call processTeleportation when debugMode during playerNavigation event', () => {
        (roomService.getRoom as jest.Mock).mockReturnValue(mockRoomDebug[0]);
        jest.spyOn(gameService, 'processNavigation');
        const path = [{ x: 1, y: 2 }];
        gateway.handlePlayerNavigation(mockClient, path);
        expect(gameService.processTeleportation).toHaveBeenCalled();
    });

    it('should call set tiles doorAction event', () => {
        const mockPlayer = { position: { x: 1, y: 1 } } as Player;
        jest.spyOn(gameService, 'handleDoor');
        const doorActionData: DoorActionData = { clickedPosition: { x: 0, y: 0 }, player: mockPlayer };

        gateway.handleDoorAction(mockClient, doorActionData);
        expect(gameService.handleDoor).toHaveBeenCalledWith(mockClient, server, doorActionData);
    });

    it('should create and assign a bot with an avatar and stats, then notify clients', () => {
        const behavior = Behavior.Aggressive;
        gameService.createBot = jest.fn();
        gateway.handleCreateBot(mockClient, behavior);
        expect(gameService.createBot).toHaveBeenCalledWith(behavior, mockClient, server);
    });

    it('should kick a bot, update avatars, and notify clients', () => {
        const botId = 'bot';
        gameService.onKickBot = jest.fn();

        gateway.handleKickBot(mockClient, botId);

        expect(gameService.onKickBot).toHaveBeenCalledWith(mockClient, botId, server);
    });

    it('should update debugMode in gameService, update logs and emit debugMode', () => {
        const debugMode = true;
        (roomService.getRoom as jest.Mock).mockReturnValue(mockRooms[0]);
        jest.spyOn(gameService, 'updateLogsDebugMode');
        gateway.handleDebugMode(mockClient, debugMode);
        expect(gameService.updateLogsDebugMode).toHaveBeenCalledWith(debugMode, server, mockClient);
        expect(server.to(roomId).emit).toHaveBeenCalledWith('debugMode', debugMode);
    });

    it('should call startFight startFight event', () => {
        const player1 = { id: '1', attributes: { attack: 10, atkDiceMax: 6, currentHp: 10 } } as Player;
        const player2 = { id: '2', attributes: { defense: 5, defDiceMax: 6, currentHp: 5 } } as Player;
        const isPlayer1Active = true;
        combatService.startFight = jest.fn();
        gateway.handleStartFight(mockClient, { player1, player2, isPlayer1Active });
        expect(combatService.startFight).toHaveBeenCalled();
    });

    it('should call attackPlayer attackPlayer event', () => {
        combatService.attackPlayer = jest.fn();
        gateway.handleAttackPlayer(mockClient);
        expect(combatService.attackPlayer).toHaveBeenCalled();
    });

    it('should call evadingPlayer evadingPlayer event', () => {
        combatService.evadingPlayer = jest.fn();
        gateway.handleEvadeCombat(mockClient);
        expect(combatService.evadingPlayer).toHaveBeenCalled();
    });

    it('should emit pathfound on findPath event', () => {
        const path = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
        ];
        const position = { x: 0, y: 0 };

        (roomService.getRoom as jest.Mock).mockReturnValue(mockRoom);
        gameService.getActivePlayer = jest.fn().mockReturnValue(mockPlayer);
        mockRoom.navigation.findFastestPath = jest.fn().mockReturnValue(path);

        gateway.handleFindPath(socket, position);
        expect(gameService.getActivePlayer).toHaveBeenCalledWith(mockRoom);
        expect(roomService.getRoom).toHaveBeenCalledWith(socket);
        expect(mockRoom.navigation.findFastestPath).toHaveBeenCalledWith(mockPlayer, position, mockRoom);
        expect(server.to(roomId).emit).toHaveBeenCalledWith('pathFound', path);
    });
});
