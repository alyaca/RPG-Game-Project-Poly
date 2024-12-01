import { Stopwatch } from '@app/classes/stopwatch/stopwatch';
import { Timer } from '@app/classes/timer/timer';
import { DEFAULT_ATTRIBUTE, EQUAL_ODDS_FAIL, EQUAL_ODDS_SUCCESS, HIGH_ATTRIBUTE, MOVEMENT_TIME } from '@app/constants';
import { mockGlobalStats } from '@app/mocks/default-global-stats';
import { baseBot, mockAttributes, mockPlayerInventory, mockPlayers } from '@app/mocks/mock-players';
import { mockRoom, mockRooms } from '@app/mocks/mock-room';
import { mockServer } from '@app/mocks/mock-server';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { MatchService } from '@app/services/match/match.service';
import { PlayerInventoryService } from '@app/services/player-inventory/player-inventory.service';
import { RoomService } from '@app/services/room/room.service';
import { avatars } from '@common/avatars-info';
import { TileCost, TileType } from '@common/constants';
import { Behavior, Player, Position, Status } from '@common/interfaces/player';
import { GameStatus, Room } from '@common/interfaces/room';
import { ServerToClientEvent } from '@common/socket.events';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

/* eslint-disable max-lines */
describe('GameService', () => {
    let service: GameService;
    let mockSocket: Socket;
    let roomId: string;
    let roomService: RoomService;
    let gameLogsService: GameLogsService;
    let room: Room;
    let mockPlayer: Player;
    let listPlayers: Player[];
    let matchService: MatchService;

    beforeEach(async () => {
        mockSocket = {
            emit: jest.fn(),
            data: { roomCode: '1234', username: 'the-user' },
            id: 'admin1234',
            rooms: new Set(['1234']),
            to: jest.fn().mockReturnThis(),
        } as unknown as Socket;

        listPlayers = [
            { id: 'player1', attributes: { speed: 10 }, status: Status.Player, isActive: true },
            { id: 'player2', attributes: { speed: 20 }, status: Status.Disconnected, isActive: false },
            { id: 'player3', attributes: { speed: 15 }, status: Status.Admin, isActive: false },
            { id: 'player4', attributes: { speed: 5 }, status: Status.Disconnected, isActive: false },
        ] as unknown as Player[];

        const playerInventoryServiceMock = {
            updateInventory: jest.fn(),
            determineRandomItem: jest.fn(),
            addStatsFromItem: jest.fn(),
            removeItemEffects: jest.fn(),
            updatePlayerWithItem: jest.fn(),
            updatePlayerAfterSwap: jest.fn(),
        };

        const gameLogsServiceMock = {
            createLog: jest.fn(),
            getGameLog: jest.fn(),
            sendDebugLog: jest.fn(),
            sendPlayerLog: jest.fn(),
        };
        const matchServiceMock = {
            processMapObjects: jest.fn(),
        };
        const roomServiceMock = {
            isRoomActive: jest.fn(),
            isPlayerAdmin: jest.fn(),
            getRoom: jest.fn(),
            deleteRoom: jest.fn(),
            leaveRoom: jest.fn(),
            getFightTimer: jest.fn().mockReturnValue({
                stopTimer: jest.fn(),
            }),
            getTurnTimer: jest.fn().mockReturnValue({
                stopTimer: jest.fn(),
            }),
            rooms: new Map([[roomId, room]]),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameService,
                { provide: RoomService, useValue: roomServiceMock },
                { provide: GameLogsService, useValue: gameLogsServiceMock },
                { provide: MatchService, useValue: matchServiceMock },
                { provide: PlayerInventoryService, useValue: playerInventoryServiceMock },
            ],
        }).compile();
        (mockServer.to as jest.Mock).mockReturnValue({ emit: jest.fn() });

        service = module.get<GameService>(GameService);
        roomService = module.get<RoomService>(RoomService);
        gameLogsService = module.get<GameLogsService>(GameLogsService);
        matchService = module.get<MatchService>(MatchService);
        room = mockRoom;
        roomId = room.roomId;
        mockPlayer = mockPlayers[0];
        room.listPlayers.push(mockPlayer);
        (roomService.getRoom as jest.Mock).mockReturnValue(room);
        service['io'] = mockServer;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should set isLocked on toggleLockRoom', () => {
        jest.spyOn(service, 'getGame').mockReturnValue(room);
        service.toggleLockRoom(roomId, true);

        expect(service.getGame).toHaveBeenCalledWith(roomId);
        expect(room.isLocked).toBe(true);
    });

    it('should return game when getGame is called', () => {
        roomService.rooms.set(roomId, room);
        const result = service.getGame(roomId);
        expect(result).toEqual(room);
    });

    describe('connectPlayerToGame', () => {
        it('should return an error if the room code format is invalid', () => {
            service['isCodeFormatValid'] = jest.fn().mockReturnValue(false);

            const code = 'test';
            const result = service.connectPlayerToGame(code);

            expect(result).toEqual({ event: 'joinError', errorType: 'invalidFormat' });
            expect(service['isCodeFormatValid']).toHaveBeenCalledWith(code);
        });

        it('should return an error if the room is not active', () => {
            (roomService.isRoomActive as jest.Mock).mockReturnValue(false);
            roomService.rooms.set(roomId, room);
            const result = service.connectPlayerToGame(roomId);

            expect(result).toEqual({ event: 'joinError', errorType: 'roomNotFound' });
            expect(roomService.isRoomActive).toHaveBeenCalledWith(roomId);
        });

        it('should return an error if the room is locked', () => {
            (roomService.isRoomActive as jest.Mock).mockReturnValue(true);
            room.isLocked = true;
            roomService.rooms.set(roomId, room);

            const result = service.connectPlayerToGame(roomId);

            expect(result).toEqual({ event: 'joinError', errorType: 'roomLocked' });
            expect(roomService.isRoomActive).toHaveBeenCalledWith(roomId);
        });

        it('should return joinedRoom event if the room is active and not locked', () => {
            (roomService.isRoomActive as jest.Mock).mockReturnValue(true);
            room.isLocked = false;
            roomService.rooms.set(roomId, room);

            const result = service.connectPlayerToGame(roomId);

            expect(result).toEqual({ event: 'joinedRoom' });
            expect(roomService.isRoomActive).toHaveBeenCalledWith(roomId);
        });
    });

    it('should create a player on createPlayer', () => {
        service['setUniquePlayerName'] = jest.fn().mockImplementation(() => {
            mockPlayer.name = 'name';
            mockSocket.data.username = mockPlayer.name;
        });
        (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(true);

        service.createPlayer(room, mockPlayer, mockSocket);

        expect(mockPlayer.status).toBe(Status.Admin);
        expect(mockSocket.data.username).toBe(mockPlayer.name);
        expect(room.listPlayers).toContainEqual(mockPlayer);
        expect(service['setUniquePlayerName']).toHaveBeenCalled();
    });

    describe('leavePlayerFromGame', () => {
        it('should emit leftRoom and delete room if player is admin', () => {
            room.gameStatus = GameStatus.Lobby;
            gameLogsService.sendPlayerLog = jest.fn();
            (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(true);
            jest.spyOn(service, 'removePlayerFromRoom');
            service.leavePlayerFromGame(roomId, mockSocket, mockServer);

            expect(mockSocket.emit).toHaveBeenCalledWith(ServerToClientEvent.LeftRoom, true);
            expect(roomService.deleteRoom).toHaveBeenCalledWith(roomId, mockSocket);
            expect(service.removePlayerFromRoom).not.toHaveBeenCalled();
        });

        it('should emit leftRoom and update player if player is not admin', () => {
            (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(false);
            jest.spyOn(service, 'removePlayerFromRoom');
            service.leavePlayerFromGame(roomId, mockSocket, mockServer);

            expect(mockSocket.emit).toHaveBeenCalledWith(ServerToClientEvent.LeftRoom, false);
            expect(service.removePlayerFromRoom).toHaveBeenCalledWith(roomId, mockSocket, mockServer);
            expect(mockSocket.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.UpdatedPlayer, room);
        });

        it('should emit debugMode false when player is admin and room is in debug mode', () => {
            room.isDebug = true;
            (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(true);
            service.leavePlayerFromGame(roomId, mockSocket, mockServer);

            expect(mockSocket.emit).toHaveBeenCalledWith(ServerToClientEvent.LeftRoom, true);
            expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.DebugMode, false);
        });

        it('should emit disconnectedPlayer when leaving a started game', () => {
            service.getPlayerById = jest.fn().mockReturnValue(mockPlayers[0]);
            service.getActivePlayer = jest.fn().mockReturnValue(mockPlayers[1]);
            (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(false);
            room.gameStatus = GameStatus.Started;
            service['playerDisconnected'] = jest.fn();
            service.leavePlayerFromGame(roomId, mockSocket, mockServer);

            expect(mockSocket.emit).toHaveBeenCalledWith(ServerToClientEvent.LeftRoom, false);
            expect(service['playerDisconnected']).toHaveBeenCalledWith(room, mockSocket, mockServer);
            expect(mockSocket.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.PlayerDisconnected, room.listPlayers);
        });
    });

    it('should select an avatar and update the socket data on selectedAvatar', () => {
        const avatar = avatars[0];
        avatar.isTaken = false;
        service['getAvatarByName'] = jest.fn().mockReturnValue(avatar);
        service.selectedAvatar(room, avatar, mockSocket, mockServer);

        expect(avatar.isTaken).toBe(true);

        expect(mockSocket.data.clickedAvatar).toBe(avatar);
    });

    it('should free up the previously selected avatar', () => {
        const clickedAvatar = avatars[0];
        clickedAvatar.isTaken = true;
        mockSocket.data.clickedAvatar = clickedAvatar;
        service['getAvatarByName'] = jest.fn().mockReturnValue(clickedAvatar);

        service['freeUpAvatar'](room, mockSocket);

        expect(service['getAvatarByName']).toHaveBeenCalledWith(room, clickedAvatar);
        expect(clickedAvatar.isTaken).toBe(false);
    });

    it('should not free up avatar if none is clicked', () => {
        service['freeUpAvatar'](room, mockSocket);
        expect(mockSocket.data.clickedAvatar).toBeUndefined();
    });

    it('should send customized avatar list to the client with correct isTaken and isSelected properties', () => {
        const clickedAvatar = avatars[0];
        const expectedAvatarList = avatars
            .filter((avatar) => avatar.name !== clickedAvatar.name)
            .map((avatar) => ({
                ...avatar,
                isSelected: false,
            }));
        mockSocket.data.clickedAvatar = clickedAvatar;

        service['sendAvatarListToClient'](mockSocket);

        expect(mockSocket.emit).toHaveBeenCalledWith(ServerToClientEvent.CharacterSelected, [
            {
                ...clickedAvatar,
                isTaken: false,
                isSelected: true,
            },
            ...expectedAvatarList,
        ]);
    });

    it('should send customized avatar list to the client if no clicked avatar', () => {
        const clickedAvatar = avatars[0];
        const expectedAvatarList = avatars
            .filter((avatar) => avatar.name !== clickedAvatar.name)
            .map((avatar) => ({
                ...avatar,
                isSelected: false,
            }));

        service['sendAvatarListToClient'](mockSocket);

        expect(mockSocket.emit).toHaveBeenCalledWith(ServerToClientEvent.CharacterSelected, [
            {
                ...clickedAvatar,
                isTaken: false,
                isSelected: false,
            },
            ...expectedAvatarList,
        ]);
    });

    it('should call sendAvatarListToClient for each connected socket', () => {
        service['sendAvatarListToClient'] = jest.fn().mockImplementation(() => {
            return avatars;
        });
        mockServer.sockets.sockets.set(mockSocket.id, mockSocket);
        service['updateAvatarsForAllClients'](mockServer, roomId);

        expect(service['sendAvatarListToClient']).toHaveBeenCalledTimes(1);
    });

    it('should set an unique player name', () => {
        service['generateUniquePlayerName'] = jest.fn().mockReturnValue('uniqueName');
        service['setUniquePlayerName'](mockPlayer, mockSocket, true);
        expect(mockPlayer.name).toBe('uniqueName');
    });

    it('should return true if player name is taken', () => {
        const playersList: Player[] = [
            { name: 'player1', avatar: avatars[0], id: '1' } as Player,
            { name: 'player1-2', avatar: avatars[1], id: '2' } as Player,
        ];
        room.listPlayers = playersList;
        const result = service['isPlayerNameTaken']('player1', mockSocket);

        expect(result).toBe(true);
        expect(roomService.getRoom).toHaveBeenCalledWith(mockSocket);
    });

    it('should return the same name if it is unique', () => {
        const playerName = 'uniquePlayer';
        service['isPlayerNameTaken'] = jest.fn().mockReturnValue(false);
        const result = service['generateUniquePlayerName'](playerName, mockSocket);

        expect(result).toBe(playerName);
        expect(service['isPlayerNameTaken']).toHaveBeenCalledWith(playerName, mockSocket);
    });

    it('should return a name with suffix if the name is taken', () => {
        const playerName = 'player1';
        service['isPlayerNameTaken'] = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);

        const result = service['generateUniquePlayerName'](playerName, mockSocket);

        expect(result).toBe('player1-2');
        expect(service['isPlayerNameTaken']).toHaveBeenCalledTimes(2);
        expect(service['isPlayerNameTaken']).toHaveBeenCalledWith(playerName, mockSocket);
        expect(service['isPlayerNameTaken']).toHaveBeenCalledWith('player1-2', mockSocket);
    });

    describe('isCodeFormatValid', () => {
        it('should be true if the code is 4 numbers', () => {
            expect(service['isCodeFormatValid'](roomId)).toBeTruthy();
        });

        it('should be false if the code is not composed of 4 numbers', () => {
            const roomCode = '12o4';
            expect(service['isCodeFormatValid'](roomCode)).toBeFalsy();
        });

        it('should be false if the code length is smaller than 4 numbers', () => {
            const roomCode = '123';
            expect(service['isCodeFormatValid'](roomCode)).toBeFalsy();
        });

        it('should be false if the code are not numbers', () => {
            const roomCode = 'pljd';
            expect(service['isCodeFormatValid'](roomCode)).toBeFalsy();
        });
    });

    it('should update the active player correctly', () => {
        room.listPlayers = mockPlayers;
        service['getPlayerConnectedInRoom'] = jest.fn().mockReturnValue(mockPlayers);
        service['playerInWall'] = jest.fn().mockReturnValue(false);
        service['updateActivePlayer'](mockServer, mockRoom);
        expect(mockPlayers[0].isActive).toBe(false);
        expect(mockPlayers[1].isActive).toBe(true);
    });

    it('should return only connected players', () => {
        room.listPlayers = listPlayers;
        const connectedPlayers = service['getPlayerConnectedInRoom'](room);

        const expectedPlayers = [
            { id: 'player1', attributes: { speed: 10 }, status: Status.Player, isActive: true },
            { id: 'player3', attributes: { speed: 15 }, status: Status.Admin, isActive: false },
        ];
        expect(connectedPlayers).toEqual(expectedPlayers);
    });

    it('should return true if the player is active', () => {
        jest.spyOn(service, 'getPlayerById').mockReturnValue(listPlayers[0]);

        const isActive = service['isActivePlayer'](mockSocket);
        expect(isActive).toBe(true);
    });

    it('should return active player', () => {
        room.listPlayers = listPlayers;
        const activePlayer = service.getActivePlayer(room);
        expect(activePlayer).toBe(listPlayers[0]);
    });

    it('should return player by id', () => {
        room.listPlayers = mockPlayers;
        const player = service.getPlayerById(room, mockSocket);
        expect(player).toBe(mockPlayers[0]);
    });

    it('should stop both timers when no sockets are in the room', () => {
        mockServer.sockets.adapter.rooms.set(roomId, null);
        jest.spyOn(roomService, 'getFightTimer');
        jest.spyOn(roomService, 'getTurnTimer');

        service.stopGameTimers(room);

        expect(roomService.getFightTimer).toHaveBeenCalledWith(roomId);
        expect(roomService.getTurnTimer).toHaveBeenCalledWith(roomId);
    });

    it('should set active player and sort players onStartGame', () => {
        const listPlayersInactive = [
            { id: 'player1', attributes: { speed: 10 }, status: Status.Player, isActive: false },
            { id: 'player2', attributes: { speed: 20 }, status: Status.Player, isActive: false },
        ] as unknown as Player[];
        room.listPlayers = listPlayersInactive;
        service.emitStartGameEvents = jest.fn();
        jest.spyOn(matchService, 'processMapObjects');

        service['sortPlayersBySpeed'] = jest.fn();
        service.onStartGame(mockSocket, mockServer);
        expect(room.gameStatus).toEqual(GameStatus.Started);
        expect(service['sortPlayersBySpeed']).toHaveBeenCalled();
        expect(room.listPlayers[0].isActive).toBe(true);
    });

    it('should update active player onTurnEnded', () => {
        const players = [
            { id: 'player1', attributes: { speed: 10 }, status: Status.Player, isActive: true },
            { id: 'player2', attributes: { speed: 20 }, status: Status.Player, isActive: false },
        ] as unknown as Player[];
        const mockTiles = [{ x: 0, y: 0 }];
        room.listPlayers = players;
        service['updateActivePlayer'] = jest.fn();
        jest.spyOn(service, 'getActivePlayer').mockReturnValue(players[0]);
        service.checkActions = jest.fn();

        room.navigation.findReachableTiles = jest.fn().mockReturnValue(mockTiles);
        service.onTurnEnded(mockSocket, mockServer);

        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.Reachability, players[0]);
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.ActivePlayer, players[0]);
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.TurnEnded, room.listPlayers);
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.ReachableTiles, mockTiles);
    });

    it('should not update active player if moving', () => {
        service.isMoving = true;
        jest.spyOn(service, 'getActivePlayer').mockReturnValue(listPlayers[0]);
        service.onTurnEnded(mockSocket, mockServer);
        expect(service.isTurnSkipped).toBe(true);
    });

    it('should sort players by speed descending and move disconnected players to the end', () => {
        const player1 = { attributes: { speed: 10 }, status: Status.Disconnected } as unknown as Player;
        const player2 = { attributes: { speed: 15 }, status: Status.Player } as unknown as Player;
        const player3 = { attributes: { speed: 5 }, status: Status.Player } as unknown as Player;
        const player4 = { attributes: { speed: 20 }, status: Status.Player } as unknown as Player;

        room.listPlayers = [player1, player2, player3, player4];

        service['sortPlayersBySpeed'](room);

        expect(room.listPlayers).toEqual([player4, player2, player3, player1]);
    });

    describe('playerDisconnected', () => {
        it('should mark player as disconnected and emit event', () => {
            const player = { id: 'player-id', status: Status.Player } as unknown as Player;
            room.listPlayers = [player];
            jest.spyOn(service, 'getPlayerById').mockReturnValue(player);
            service['sortPlayersBySpeed'] = jest.fn();

            service['playerDisconnected'](room, mockSocket, mockServer);

            expect(player.status).toBe(Status.Disconnected);
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.PlayerDisconnected, player);
            expect(service['sortPlayersBySpeed']).toHaveBeenCalled();
            expect(service.getPlayerById).toHaveBeenCalled();
        });

        it('should call onTurnEnded if the disconnected player is active', () => {
            const activePlayer = { id: 'active-player-id', isActive: true, status: Status.Player } as unknown as Player;
            room.listPlayers = [activePlayer];

            jest.spyOn(service, 'getPlayerById').mockReturnValue(activePlayer);
            service['isActivePlayer'] = jest.fn().mockReturnValue(true);
            jest.spyOn(service, 'onTurnEnded').mockImplementation();

            service['playerDisconnected'](room, mockSocket, mockServer);

            expect(service.onTurnEnded).toHaveBeenCalledWith(mockSocket, mockServer);
        });

        it('should emit draw if player is the last one in game', () => {
            const player = { id: 'player-id', status: Status.Player } as unknown as Player;
            jest.spyOn(service, 'getPlayerById').mockReturnValue(player);
            service['isActivePlayer'] = jest.fn().mockReturnValue(false);
            service['isLastPlayer'] = jest.fn().mockReturnValue(true);
            service['sortPlayersBySpeed'] = jest.fn();

            service['playerDisconnected'](room, mockSocket, mockServer);
            expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.DrawGame);
        });
    });

    describe('playerTurnTimer', () => {
        it('should emit startedTurnTimer with remaining time', () => {
            const remainingTime = 5;
            const turnTimerCallback = jest.fn();
            const resetTimerMock = jest.fn((time, callback) => {
                turnTimerCallback.mockImplementation(callback);
            });
            const turnTimer = {
                resetTimer: resetTimerMock,
            } as unknown as Timer;

            jest.spyOn(roomService, 'getTurnTimer').mockReturnValue(turnTimer);
            jest.spyOn(service, 'onTurnEnded').mockImplementation();
            service['playerTurnTimer'](mockSocket, mockServer);
            turnTimerCallback(remainingTime);

            expect(roomService.getTurnTimer).toHaveBeenCalledWith(room.roomId);
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.StartedTurnTimer, remainingTime);
            turnTimerCallback(0);
            expect(service.onTurnEnded).toHaveBeenCalledWith(mockSocket, mockServer);
        });
    });

    describe('onStartTurn', () => {
        it('should start the turn timer and emit otherPlayerTurn', () => {
            const remainingTime = 5;
            const turnTimerCallback = jest.fn();
            const startTimerMock = jest.fn((time, callback) => {
                turnTimerCallback.mockImplementation(callback);
            });
            const turnTimer = {
                startTimer: startTimerMock,
            } as unknown as Timer;

            jest.spyOn(roomService, 'getTurnTimer').mockReturnValue(turnTimer);
            jest.spyOn(service, 'getActivePlayer').mockReturnValue(listPlayers[0]);

            service['playerTurnTimer'] = jest.fn();
            service.onStartTurn(mockSocket, mockServer);
            turnTimerCallback(remainingTime);
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.OtherPlayerTurn, listPlayers[0].name);
            expect(gameLogsService.sendPlayerLog).toHaveBeenCalled();
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.BeforeStartTurnTimer, remainingTime);

            turnTimerCallback(0);
            expect(service['playerTurnTimer']).toHaveBeenCalledWith(mockSocket, mockServer);
        });
    });

    describe('checkFell', () => {
        it('should return true if random value is greater than FALLING_PROBABILITY and debugMode is false', () => {
            const value = 0.4;
            jest.spyOn(Math, 'random').mockReturnValue(value);
            const result = service['checkFell']();
            expect(result).toBe(true);
        });
        it('should return false if random value is less than or equal to FALLING_PROBABILITY and debugMode is false', () => {
            service['isDebugMode'] = false;
            jest.spyOn(Math, 'random').mockReturnValue(0);
            const result = service['checkFell']();
            expect(result).toBe(false);
        });
        afterEach(() => {
            jest.restoreAllMocks();
        });
    });

    it('should resolve after the specified delay', async () => {
        const ms = 100;
        const startTime = Date.now();
        await service.delay(ms);
        const elapsedTime = Date.now() - startTime;

        expect(elapsedTime).toBeGreaterThanOrEqual(ms);
    });

    it('should return the corresponding cost for tile', () => {
        expect(service['getCost'](TileType.Ground, mockPlayers[0])).toBe(TileCost.Ground);
        expect(service['getCost'](TileType.Water, mockPlayers[0])).toBe(TileCost.Water);
        expect(service['getCost'](TileType.Ice, mockPlayers[0])).toBe(TileCost.Ice);
        expect(service['getCost'](TileType.OpenDoor, mockPlayers[0])).toBe(TileCost.OpenDoor);
        expect(service['getCost'](0, mockPlayers[0])).toBe(Infinity);
    });

    describe('processNavigation', () => {
        let path;
        let server;
        beforeEach(() => {
            path = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
            ];
            server = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            } as unknown as Server;
            jest.spyOn(service, 'getActivePlayer').mockReturnValue(mockPlayers[0]);
            service.delay = jest.fn().mockResolvedValue(MOVEMENT_TIME);
            service.stopGameTimers = jest.fn();
            service.onTurnEnded = jest.fn();
            service.isTurnSkipped = true;
            service['getCost'] = jest.fn().mockReturnValue(1);
        });
        it('should navigate and emit player navigation', async () => {
            service['checkFell'] = jest.fn().mockReturnValue(true);
            room.navigation.findReachableTiles = jest.fn().mockReturnValue(path);
            service.checkEndTurn = jest.fn().mockReturnValue(false);
            service.addUniqueTileToHistory = jest.fn();
            service.checkActions = jest.fn();
            service.isTurnSkipped = false;
            await service.processNavigation(room, server, path, mockSocket);

            expect(service.getActivePlayer).toHaveBeenCalledWith(room);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.PlayerNavigation, path[0]);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.PlayerNavigation, path[1]);
            expect(mockSocket.emit).not.toHaveBeenCalledWith(ServerToClientEvent.EndMovement);
        });

        it('should navigate and emit player navigation and fell', async () => {
            room.gameMap.tiles = [
                [0, 0],
                [TileType.Ice, 0],
            ];
            service['checkFell'] = jest.fn().mockReturnValue(false);
            service.checkEndTurn = jest.fn().mockReturnValue(false);
            service.addUniqueTileToHistory = jest.fn();

            await service.processNavigation(room, server, path, mockSocket);

            expect(service.getActivePlayer).toHaveBeenCalledWith(room);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.PlayerNavigation, path[0]);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.PlayerNavigation, path[1]);
            expect(mockSocket.emit).toHaveBeenCalledWith(ServerToClientEvent.PlayerFell);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.EndMovement);
        });
        it('should navigate and end turn', async () => {
            service['checkFell'] = jest.fn().mockReturnValue(true);
            room.navigation.findReachableTiles = jest.fn().mockReturnValue(path);
            service.checkEndTurn = jest.fn().mockReturnValue(true);
            service.addUniqueTileToHistory = jest.fn();
            await service.processNavigation(room, server, path, mockSocket);

            expect(service.getActivePlayer).toHaveBeenCalledWith(room);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.PlayerNavigation, path[0]);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.PlayerNavigation, path[1]);
            expect(mockSocket.emit).not.toHaveBeenCalledWith(ServerToClientEvent.PlayerFell);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.EndMovement);
        });
    });

    describe('processTeleportation', () => {
        let position;
        let server;

        beforeEach(() => {
            position = { x: 0, y: 1 };

            server = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            } as unknown as Server;

            jest.spyOn(service, 'getActivePlayer').mockReturnValue(mockPlayers[0]);
            service.checkActions = jest.fn();

            room.navigation.findReachableTiles = jest.fn().mockReturnValue([{ x: 2, y: 2 }]);
        });

        it('should teleport the player and emit the correct events', () => {
            server.getActivePlayer = jest.fn().mockReturnValue(mockPlayers[0]);
            room.navigation.isTileValid = jest.fn().mockReturnValue(true);

            service.processTeleportation(room, server, position);
            expect(mockPlayers[0].position).toEqual(position);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.TeleportPlayer, {
                position,
                playerId: mockPlayers[0].id,
            });

            expect(room.navigation.findReachableTiles).toHaveBeenCalledWith(mockPlayers[0], room);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.ReachableTiles, [{ x: 2, y: 2 }]);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.EndMovement);
            expect(service.checkActions).toHaveBeenCalledWith(room, server);
        });
    });

    it('should handle the else branch when player status is Bot', () => {
        const mockSetUniquePlayerName = jest.fn();
        service.setUniquePlayerName = mockSetUniquePlayerName;
        const mockPlayerBot = mockPlayers[3];
        mockPlayerBot.status = Status.Bot;
        service.createPlayer(room, mockPlayerBot, mockSocket);
        expect(room.listPlayers).toContain(mockPlayerBot);
        expect(mockSetUniquePlayerName).toHaveBeenCalledWith(mockPlayerBot, mockSocket, false);
    });

    it('should assign attack and defense stats based on random values', () => {
        const mockPlayerBot = mockPlayers[3];
        mockPlayerBot.attributes = mockAttributes;
        jest.spyOn(Math, 'random').mockReturnValueOnce(EQUAL_ODDS_SUCCESS).mockReturnValueOnce(EQUAL_ODDS_FAIL);

        const result = service.assignStatsToBot(mockPlayerBot);
        expect(result.attributes.attack).toBe(HIGH_ATTRIBUTE);
        expect(result.attributes.defense).toBe(DEFAULT_ATTRIBUTE);
        expect(result.attributes.atkDiceMax).toBe(DEFAULT_ATTRIBUTE);
        expect(result.attributes.defDiceMax).toBe(HIGH_ATTRIBUTE);
    });

    it('should assign the opposite set of stats if random values are different', () => {
        const mockPlayerBot = mockPlayers[3];
        mockPlayerBot.attributes = mockAttributes;
        jest.spyOn(Math, 'random').mockReturnValueOnce(EQUAL_ODDS_FAIL).mockReturnValueOnce(EQUAL_ODDS_SUCCESS);

        const result = service.assignStatsToBot(mockPlayerBot);
        expect(result.attributes.attack).toBe(DEFAULT_ATTRIBUTE);
        expect(result.attributes.defense).toBe(HIGH_ATTRIBUTE);
        expect(result.attributes.atkDiceMax).toBe(HIGH_ATTRIBUTE);
        expect(result.attributes.defDiceMax).toBe(DEFAULT_ATTRIBUTE);
    });

    it('should assign an available avatar to an aggressive bot and mark it as taken', () => {
        const behavior = Behavior.Aggressive;
        const result = service.assignAvatarToBot(room, behavior);

        expect(result.avatar).toBeDefined();
        expect(result.avatar.isTaken).toBe(true);
        expect(result.name).toContain('-A-bot');

        const assignedAvatar = room.availableAvatars.find((avatar) => avatar.name === result.avatar.name);
        expect(assignedAvatar?.isTaken).toBe(true);
    });

    it('should assign an available avatar to a defensive bot and mark it as taken', () => {
        const behavior = Behavior.Defensive;
        const result = service.assignAvatarToBot(room, behavior);

        expect(result.avatar).toBeDefined();
        expect(result.avatar.isTaken).toBe(true);
        expect(result.name).toContain('-D-bot');

        const assignedAvatar = room.availableAvatars.find((avatar) => avatar.name === result.avatar.name);
        expect(assignedAvatar?.isTaken).toBe(true);
    });

    it('should not assign an avatar if all are taken', () => {
        room.availableAvatars.forEach((avatar) => (avatar.isTaken = true));

        const behavior = Behavior.Defensive;
        const result = service.assignAvatarToBot(room, behavior);

        expect(result.avatar).toEqual(avatars[0]);
        expect(room.availableAvatars.every((avatar) => avatar.isTaken)).toBe(true);
    });

    it('should send a message to the room when debugMode is changed', () => {
        const debugMode = true;
        service['updateLogsDebugMode'](debugMode, mockServer, mockSocket);
        expect(gameLogsService.sendDebugLog).toHaveBeenCalledWith(debugMode, room.roomId, mockServer);
    });

    describe('checkEndTurn', () => {
        let path;
        beforeEach(() => {
            path = [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
            ];
            (roomService.getRoom as jest.Mock).mockReturnValue(room);
            service['isActivePlayer'] = jest.fn().mockReturnValue(true);
            room.listPlayers = mockPlayers;
        });
        it('should return early if no active player', () => {
            service.checkEndTurn(mockSocket, undefined);
            room.navigation.findReachableTiles = jest.fn().mockReturnValue(path);
        });
        it('should return early if not active player', () => {
            service['isActivePlayer'] = jest.fn().mockReturnValue(false);
            service.checkEndTurn(mockSocket, mockPlayer);
            room.navigation.findReachableTiles = jest.fn().mockReturnValue(path);
        });
        it('should return true when no reachable tiles and no actions', () => {
            room.navigation.findReachableTiles = jest.fn().mockReturnValue([]);
            room.navigation.haveActions = jest.fn().mockReturnValue(false);
            room.navigation.hasMovementPoints = jest.fn().mockReturnValue(true);

            const result = service.checkEndTurn(mockSocket, mockPlayer);
            expect(result).toBe(true);
        });
        it('should return true when no movement points and no actions', () => {
            room.navigation.findReachableTiles = jest.fn().mockReturnValue(path);
            room.navigation.haveActions = jest.fn().mockReturnValue(false);
            room.navigation.hasMovementPoints = jest.fn().mockReturnValue(false);

            const result = service.checkEndTurn(mockSocket, mockPlayer);
            expect(result).toBe(true);
        });

        it('should return true when no movement points and no actions points', () => {
            room.navigation.findReachableTiles = jest.fn().mockReturnValue(path);
            room.navigation.haveActions = jest.fn().mockReturnValue(true);
            room.navigation.hasMovementPoints = jest.fn().mockReturnValue(false);
            room.navigation.hasActionPoints = jest.fn().mockReturnValue(false);

            const result = service.checkEndTurn(mockSocket, mockPlayer);
            expect(result).toBe(true);
        });
        it('should return true when no movement points and no actions points', () => {
            room.navigation.findReachableTiles = jest.fn().mockReturnValue(path);
            room.navigation.haveActions = jest.fn().mockReturnValue(true);
            room.navigation.hasMovementPoints = jest.fn().mockReturnValue(true);
            room.navigation.hasActionPoints = jest.fn().mockReturnValue(true);

            const result = service.checkEndTurn(mockSocket, mockPlayer);
            expect(result).toBe(false);
        });
    });

    it('should create and assign a bot with an avatar and stats, then notify clients', () => {
        const behavior = Behavior.Aggressive;
        jest.spyOn(roomService, 'getRoom').mockReturnValue(room);
        service.assignAvatarToBot = jest.fn().mockReturnValue(avatars[0]);
        service.assignStatsToBot = jest.fn().mockReturnValue(baseBot);
        service.createPlayer = jest.fn();
        service.updateAvatarsForAllClients = jest.fn();

        service.createBot(behavior, mockSocket, mockServer);

        expect(service.assignAvatarToBot).toHaveBeenCalledWith(room, behavior);
        expect(service.assignStatsToBot).toHaveBeenCalled();
        expect(service.createPlayer).toHaveBeenCalledWith(room, baseBot, mockSocket);
        expect(service.updateAvatarsForAllClients).toHaveBeenCalledWith(mockServer, roomId);
        expect(roomService.getRoom).toHaveBeenCalledWith(mockSocket);
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.UpdatedPlayer, room);
    });

    it('should call removePlayerFromRoom on onKickPlayer', () => {
        mockServer.sockets.sockets.set(mockSocket.id, mockSocket);
        (roomService.getRoom as jest.Mock).mockReturnValue(room);
        service.removePlayerFromRoom = jest.fn();

        service.onKickPlayer(mockSocket, mockServer, mockPlayer.id);

        expect(mockServer.to(mockPlayer.id).emit).toHaveBeenCalledWith(ServerToClientEvent.KickPlayer, mockPlayer.id);
        expect(service.removePlayerFromRoom).toHaveBeenCalled();
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.UpdatedPlayer, room);
    });

    it('should kick a bot, update avatars, and notify clients', () => {
        const botRoom = mockRooms[2];
        const botId = 'bot';
        const botPlayer = botRoom.listPlayers.find((player) => player.id === botId);
        if (botPlayer) {
            botPlayer.avatar = avatars[0];
            botPlayer.avatar.isTaken = true;
        }
        jest.spyOn(roomService, 'getRoom').mockReturnValue(botRoom);
        service.updateAvatarsForAllClients = jest.fn();

        service.onKickBot(mockSocket, botId, mockServer);

        expect(roomService.getRoom).toHaveBeenCalledWith(mockSocket);
        expect(botRoom.listPlayers).not.toContainEqual(expect.objectContaining({ id: botId }));
        expect(botRoom.listPlayers.find((player) => player.id === botId)).toBeUndefined();
        expect(mockServer.to(botId).emit).toHaveBeenCalledWith(ServerToClientEvent.KickPlayer, botId);
        expect(mockServer.to(botRoom.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.UpdatedPlayer, botRoom);
        expect(service.updateAvatarsForAllClients).toHaveBeenCalledWith(mockServer, botRoom.roomId);
    });

    it('should emit to client on emitStartGameEvents', () => {
        const mockTiles = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ];
        (mockServer.to as jest.Mock).mockReturnValue({ emit: jest.fn() });
        service.getActivePlayer = jest.fn().mockReturnValue(mockPlayer);
        room.navigation.findReachableTiles = jest.fn().mockReturnValue(mockTiles);
        service.checkActions = jest.fn();

        service.emitStartGameEvents(room, mockServer);

        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.StartGame, room);
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.MapInformation, room);
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.ActivePlayer, mockPlayer);
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.ReachableTiles, mockTiles);
        expect(service.checkActions).toHaveBeenCalled();
    });

    it('should call checkDoors and checkAttack around player', () => {
        service['checkDoors'] = jest.fn();
        service['checkAttack'] = jest.fn();

        service.checkActions(room, mockServer);
        expect(service['checkDoors']).toHaveBeenCalledWith(room, mockServer);
        expect(service['checkAttack']).toHaveBeenCalledWith(room, mockServer);
    });

    describe('checkAttack', () => {
        it('should emit attackAround true when attack is possible and player has action points', () => {
            room.navigation.checkAttack = jest.fn().mockReturnValue(true);
            service.getActivePlayer = jest.fn().mockReturnValue(mockPlayer);
            room.navigation.hasActionPoints = jest.fn().mockReturnValue(true);
            room.navigation.getNeighborPlayers = jest.fn().mockReturnValue([mockPlayer]);

            service['checkAttack'](room, mockServer);

            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.AttackAround, {
                attackAround: true,
                targets: [mockPlayer],
            });
        });

        it('should emit attackAround false when attack is not possible and player has action points', () => {
            room.navigation.checkAttack = jest.fn().mockReturnValue(false);
            service.getActivePlayer = jest.fn().mockReturnValue(mockPlayer);
            room.navigation.hasActionPoints = jest.fn().mockReturnValue(false);

            service['checkAttack'](room, mockServer);

            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.AttackAround, false);
        });
    });

    describe('checkDoors', () => {
        it('should emit doorAround true when door is around and player has action points', () => {
            room.navigation.checkDoor = jest.fn().mockReturnValue(true);
            service.getActivePlayer = jest.fn().mockReturnValue(mockPlayer);
            room.navigation.hasActionPoints = jest.fn().mockReturnValue(true);
            room.navigation.getNeighborDoors = jest.fn().mockReturnValue([{ x: 0, y: 0 }]);

            service['checkDoors'](room, mockServer);

            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.DoorAround, {
                doorAround: true,
                targets: [{ x: 0, y: 0 }],
            });
        });

        it('should emit doorAround false when door is not around and player has action points', () => {
            room.navigation.checkDoor = jest.fn().mockReturnValue(false);
            service.getActivePlayer = jest.fn().mockReturnValue(mockPlayer);
            room.navigation.hasActionPoints = jest.fn().mockReturnValue(false);

            service['checkDoors'](room, mockServer);

            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.DoorAround, false);
        });
    });

    it('should handle door if a closed door is clicked', () => {
        const mockTiles = [
            { x: 0, y: 0 },
            { x: 0, y: 1 },
        ];
        const doorActionData = { clickedPosition: { x: 1, y: 1 }, player: mockPlayer };
        (roomService.getRoom as jest.Mock).mockReturnValue(room);
        room.navigation.hasHandleDoorAction = jest.fn().mockReturnValue(true);
        room.navigation.findReachableTiles = jest.fn().mockReturnValue(mockTiles);
        service.getActivePlayer = jest.fn().mockReturnValue(mockPlayer);
        service.checkEndTurn = jest.fn().mockReturnValue(true);
        service.onTurnEnded = jest.fn();
        gameLogsService.sendDoorLog = jest.fn();

        service.handleDoor(mockSocket, mockServer, doorActionData);

        expect(gameLogsService.sendDoorLog).toHaveBeenCalled();
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.DoorClicked, room.navigation.gameMap.tiles);
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith(ServerToClientEvent.ReachableTiles, mockTiles);
        expect(service.onTurnEnded).toHaveBeenCalled();
    });

    it('should reset globalPostGameStats in the room', () => {
        room.globalPostGameStats = mockGlobalStats;
        service.resetGlobalStats(room);
        expect(room.globalPostGameStats.globalTilesVisited).toEqual([]);
        expect(room.globalPostGameStats.doorsInteracted).toEqual([]);
        expect(room.globalPostGameStats.turns).toBe(1);
        expect(room.globalPostGameStats.nbFlagBearers).toBe(0);
        expect(room.globalPostGameStats.gameDuration).toBe('');
    });

    it('should handle end of the game correctly', () => {
        const mockWinner = mockPlayers[0];
        room.stopwatch = {
            stop: jest.fn(),
            getTime: jest.fn().mockReturnValue('15:32'),
        } as unknown as Stopwatch;

        jest.spyOn(service, 'resetGlobalStats');
        jest.spyOn(service, 'stopGameTimers');

        service.onEndGame(mockWinner, room, mockServer);

        expect(room.gameStatus).toBe(GameStatus.Ended);
        expect(room.stopwatch.stop).toHaveBeenCalled();
        expect(mockServer.to).toHaveBeenCalledWith(room.roomId);

        expect(service.resetGlobalStats).toHaveBeenCalledWith(room);
        expect(service.stopGameTimers).toHaveBeenCalledWith(room);
    });

    describe('addUniqueTileToHistory', () => {
        it('should add a tile to the position list if it does not already exist', () => {
            const positionList = [{ x: 0, y: 0 }];
            const newTile = { x: 1, y: 1 };
            service.addUniqueTileToHistory(positionList, newTile);

            expect(positionList).toContainEqual(newTile);
            expect(positionList.length).toBe(2);
        });

        it('should not add a tile if a matching position already exists', () => {
            const positionList = [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
            ];
            const duplicateTile = { x: 1, y: 1 };

            service.addUniqueTileToHistory(positionList, duplicateTile);

            expect(positionList).toContainEqual(duplicateTile);
            expect(positionList.length).toBe(2);
        });

        it('should handle an empty position list and add the tile', () => {
            const positionList: Position[] = [];
            const newTile = { x: 1, y: 2 };

            service.addUniqueTileToHistory(positionList, newTile);

            expect(positionList).toContainEqual(newTile);
            expect(positionList.length).toBe(1);
        });
    });

    it('should end the game if the player is on his spawn with the flag on capture the flag mode', () => {
        const player = mockPlayerInventory[0];
        player.position = player.spawnPosition;
        service.onEndGame = jest.fn();
        gameLogsService.sendEndGameLog = jest.fn();

        service['checkFlagModeEndGame'](player, room, mockServer);

        expect(service.onEndGame).toHaveBeenCalledWith(player, room, mockServer);
        expect(gameLogsService.sendEndGameLog).toHaveBeenCalledWith(room.listPlayers, room.roomId, mockServer);
    });
});
