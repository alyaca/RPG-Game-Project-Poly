import { Timer } from '@app/classes/timer/timer';
import { DEFAULT_ATTRIBUTE, EQUAL_ODDS_FAIL, EQUAL_ODDS_SUCCESS, HIGH_ATTRIBUTE, MOVEMENT_TIME, TileCost, TileType } from '@app/constants';
import { mockPlayers, mockAttributes } from '@app/mocks/mock-players';
import { mockRooms } from '@app/mocks/mock-room';
import { mockServer } from '@app/mocks/mock-server';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { MatchService } from '@app/services/match/match.service';
import { RoomService } from '@app/services/room/room.service';
import { avatars } from '@common/avatars-info';
import { Behavior, Player, Status } from '@common/player';
import { GameStatus, Room } from '@common/room';
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

        const gameLogsServiceMock = {
            createLog: jest.fn(),
            getGameLog: jest.fn(),
            sendTurnLog: jest.fn(),
            generateTurnMessage: jest.fn(),
            generateGiveUpGame: jest.fn(),
            sendDebugMessage: jest.fn(),
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
            ],
        }).compile();

        service = module.get<GameService>(GameService);
        roomService = module.get<RoomService>(RoomService);
        gameLogsService = module.get<GameLogsService>(GameLogsService);
        matchService = module.get<MatchService>(MatchService);
        room = mockRooms[0];
        roomId = '1234';
        mockPlayer = { id: 'currentplayer', name: 'player1', avatar: avatars[0] } as Player;
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
            roomService.rooms.set(roomId, mockRooms[0]);
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
            (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(true);
            jest.spyOn(service, 'removePlayerFromRoom');
            service.leavePlayerFromGame(roomId, mockSocket, mockServer);

            expect(mockSocket.emit).toHaveBeenCalledWith('leftRoom', true);
            expect(roomService.deleteRoom).toHaveBeenCalledWith(roomId, mockSocket);
            expect(service.removePlayerFromRoom).not.toHaveBeenCalled();
        });

        it('should emit leftRoom and update player if player is not admin', () => {
            (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(false);
            jest.spyOn(service, 'removePlayerFromRoom');
            service.leavePlayerFromGame(roomId, mockSocket, mockServer);

            expect(mockSocket.emit).toHaveBeenCalledWith('leftRoom', false);
            expect(service.removePlayerFromRoom).toHaveBeenCalledWith(roomId, mockSocket, mockServer);
            expect(mockSocket.to(roomId).emit).toHaveBeenCalledWith('updatedPlayer', room);
        });

        it('should emit debugMode false when player is admin and room is in debug mode', () => {
            room.isDebug = true;
            (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(true);
            service.leavePlayerFromGame(roomId, mockSocket, mockServer);

            expect(mockSocket.emit).toHaveBeenCalledWith('leftRoom', true);
            expect(mockServer.to(roomId).emit).toHaveBeenCalledWith('debugMode', false);
        });

        it('should emit disconnectedPlayer when leaving a started game', () => {
            (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(false);
            room.gameStatus = GameStatus.Started;
            service['playerDisconnected'] = jest.fn();
            service.leavePlayerFromGame(roomId, mockSocket, mockServer);

            expect(mockSocket.emit).toHaveBeenCalledWith('leftRoom', false);
            expect(service['playerDisconnected']).toHaveBeenCalledWith(room, mockSocket, mockServer);
            expect(mockSocket.to(roomId).emit).toHaveBeenCalledWith('disconnectedPlayer', room.listPlayers);
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

        expect(mockSocket.emit).toHaveBeenCalledWith('characterSelected', [
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

        expect(mockSocket.emit).toHaveBeenCalledWith('characterSelected', [
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
        const result = service['isPlayerNameTaken'](mockPlayer.name, mockSocket);

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

        service['updateActivePlayer'](mockSocket);
        expect(mockPlayers[0].isActive).toBe(false);
        expect(mockPlayers[1].isActive).toBe(true);

        expect(roomService.getRoom).toHaveBeenCalledWith(mockSocket);
        expect(service['getPlayerConnectedInRoom']).toHaveBeenCalledWith(room);
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
        jest.spyOn(matchService, 'processMapObjects');

        service['sortPlayersBySpeed'] = jest.fn();
        service.onStartGame(room, mockSocket);
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
        service.checkDoors = jest.fn();
        service.checkAttack = jest.fn();

        room.navigation.findReachableTiles = jest.fn().mockReturnValue(mockTiles);
        service.onTurnEnded(mockSocket, mockServer);

        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith('reachability', players[0]);
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith('isActive', players[0]);
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith('turnEnded', room.listPlayers);
        expect(mockServer.to(roomId).emit).toHaveBeenCalledWith('reachableTiles', mockTiles);
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
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('playerDisconnected', player);
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
            expect(mockServer.to(roomId).emit).toHaveBeenCalledWith('draw');
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
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('startedTurnTimer', remainingTime);
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
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('otherPlayerTurn', listPlayers[0].name);
            expect(gameLogsService.sendTurnLog).toHaveBeenCalled();
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('beforeStartTurnTimer', remainingTime);

            turnTimerCallback(0);
            expect(service['playerTurnTimer']).toHaveBeenCalledWith(mockSocket, mockServer);
        });
    });

    describe('checkFell', () => {
        // it('should return true if debugMode is true', () => {
        //     service['isDebugMode'] = true;
        //     const result = service['checkFell']();
        //     expect(result).toBe(true);
        // });

        it('should return true if random value is greater than FELLING_PROBABILITY and debugMode is false', () => {
            service['isDebugMode'] = false;
            const value = 0.4;
            jest.spyOn(Math, 'random').mockReturnValue(value);
            const result = service['checkFell']();
            expect(result).toBe(true);
        });
        it('should return false if random value is less than or equal to FELLING_PROBABILITY and debugMode is false', () => {
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
        expect(service['getCost'](TileType.Ground)).toBe(TileCost.Ground);
        expect(service['getCost'](TileType.Water)).toBe(TileCost.Water);
        expect(service['getCost'](TileType.Ice)).toBe(TileCost.Ice);
        expect(service['getCost'](TileType.OpenDoor)).toBe(TileCost.OpenDoor);
        expect(service['getCost'](0)).toBe(Infinity);
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
            await service.processNavigation(room, server, path, mockSocket);

            expect(service.getActivePlayer).toHaveBeenCalledWith(room);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith('playerNavigation', path[0]);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith('playerNavigation', path[1]);
            expect(mockSocket.emit).not.toHaveBeenCalledWith('playerFell');
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith('endMovement');
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
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith('playerNavigation', path[0]);
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith('playerNavigation', path[1]);
            expect(mockSocket.emit).toHaveBeenCalledWith('playerFell');
            expect(server.to(room.roomId).emit).toHaveBeenCalledWith('endMovement');
        });
    });

    describe('processTeleportation', () => {
        let path;
        let server;

        beforeEach(() => {
            path = [{ x: 1, y: 1 }];

            server = {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            } as unknown as Server;

            jest.spyOn(service, 'getActivePlayer').mockReturnValue(mockPlayers[0]);
            service.checkDoors = jest.fn();
            service.checkAttack = jest.fn();

            mockRooms[0].navigation.findReachableTiles = jest.fn().mockReturnValue([{ x: 2, y: 2 }]);
        });

        it('should teleport the player and emit the correct events', () => {
            service.processTeleportation(mockRooms[0], server, path);

            expect(service.getActivePlayer).toHaveBeenCalledWith(mockRooms[0]);
            expect(mockPlayers[0].position).toEqual(path[0]);

            expect(server.to(mockRooms[0].roomId).emit).toHaveBeenCalledWith('teleportPlayer', {
                position: path[0],
                playerId: mockPlayers[0].id,
            });

            expect(mockRooms[0].navigation.findReachableTiles).toHaveBeenCalledWith(mockPlayers[0], mockRooms[0]);
            expect(server.to(mockRooms[0].roomId).emit).toHaveBeenCalledWith('reachableTiles', [{ x: 2, y: 2 }]);
            expect(server.to(mockRooms[0].roomId).emit).toHaveBeenCalledWith('endMovement');
            expect(service.checkDoors).toHaveBeenCalledWith(mockRooms[0], server);
            expect(service.checkAttack).toHaveBeenCalledWith(mockRooms[0], server);
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

        // Verify that an available avatar is assigned
        expect(result.avatar).toBeDefined();
        expect(result.avatar.isTaken).toBe(true);
        expect(result.name).toContain('-A-bot'); // Aggressive suffix

        // Check that the avatar in the room is now marked as taken
        const assignedAvatar = room.availableAvatars.find((avatar) => avatar.name === result.avatar.name);
        expect(assignedAvatar?.isTaken).toBe(true);
    });

    it('should assign an available avatar to a defensive bot and mark it as taken', () => {
        const behavior = Behavior.Defensive;
        const result = service.assignAvatarToBot(room, behavior);

        // Verify that an available avatar is assigned
        expect(result.avatar).toBeDefined();
        expect(result.avatar.isTaken).toBe(true);
        expect(result.name).toContain('-D-bot'); // Defensive suffix

        // Check that the avatar in the room is now marked as taken
        const assignedAvatar = room.availableAvatars.find((avatar) => avatar.name === result.avatar.name);
        expect(assignedAvatar?.isTaken).toBe(true);
    });

    it('should not assign an avatar if all are taken', () => {
        room.availableAvatars.forEach((avatar) => (avatar.isTaken = true));

        const behavior = Behavior.Defensive;
        const result = service.assignAvatarToBot(room, behavior);

        expect(result.avatar).toEqual({ isSelected: true, isTaken: true, name: 'a', src: '' });
        expect(room.availableAvatars.every((avatar) => avatar.isTaken)).toBe(true);
    });

    it('should send a message to the room when debugMode is changed', () => {
        const debugMode = true;
        service['updateLogsDebugMode'](debugMode, mockServer, mockSocket);
        expect(gameLogsService.sendDebugMessage).toHaveBeenCalledWith(debugMode, room.roomId, mockServer);
    });
});
