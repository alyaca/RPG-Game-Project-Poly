import { mockRooms } from '@app/mocks/mock-room';
import { RoomService } from '@app/services/room/room.service';
import { avatars } from '@common/avatarsInfo';
import { Player, Status } from '@common/player';
import { Room } from '@common/room';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    let mockSocket: Socket;
    let mockServer: Server;
    let roomId: string;
    let roomService: RoomService;
    let room: Room;
    let mockPlayer: Player;

    beforeEach(async () => {
        mockSocket = {
            emit: jest.fn(),
            data: { roomCode: '1234' },
            id: 'admin1234',
            to: jest.fn().mockReturnThis(),
        } as unknown as Socket;

        mockServer = {
            sockets: {
                sockets: new Map(),
            },
        } as unknown as Server;

        const roomServiceMock = {
            isRoomActive: jest.fn(),
            isPlayerAdmin: jest.fn(),
            getRoom: jest.fn(),
            deleteRoom: jest.fn(),
            leaveRoom: jest.fn(),
            rooms: new Map([[roomId, room]]),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [GameService, { provide: RoomService, useValue: roomServiceMock }],
        }).compile();

        service = module.get<GameService>(GameService);
        roomService = module.get<RoomService>(RoomService);
        room = mockRooms[0];
        roomId = '1234';
        mockPlayer = { id: 'currentplayer', name: 'player1', avatar: avatars[0] } as Player;
        room.listPlayers.push(mockPlayer);
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
            jest.spyOn(service, 'isCodeFormatValid');

            (service.isCodeFormatValid as jest.Mock).mockReturnValue(false);
            const code = 'test';
            const result = service.connectPlayerToGame(code);

            expect(result).toEqual({ event: 'joinError', errorType: 'invalidFormat' });
            expect(service.isCodeFormatValid).toHaveBeenCalledWith(code);
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
        jest.spyOn(service, 'setUniquePlayerName').mockImplementation(() => {
            mockPlayer.name = 'name';
            mockSocket.data.username = mockPlayer.name;
        });
        (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(true);

        service.createPlayer(room, mockPlayer, mockSocket);

        expect(mockPlayer.status).toBe(Status.Admin);
        expect(mockSocket.data.username).toBe(mockPlayer.name);
        expect(room.listPlayers).toContainEqual(mockPlayer);
        expect(service.setUniquePlayerName).toHaveBeenCalled();
    });

    describe('leavePlayerFromGame', () => {
        it('should emit leftRoom and delete room if player is admin', () => {
            (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(true);
            (roomService.getRoom as jest.Mock).mockReturnValue(room);
            jest.spyOn(service, 'removePlayerFromRoom');
            service.leavePlayerFromGame(roomId, mockSocket);

            expect(mockSocket.emit).toHaveBeenCalledWith('leftRoom', true);
            expect(roomService.deleteRoom).toHaveBeenCalledWith(roomId, mockSocket);
            expect(service.removePlayerFromRoom).not.toHaveBeenCalled();
        });

        it('should emit leftRoom and update player if player is not admin', () => {
            (roomService.isPlayerAdmin as jest.Mock).mockReturnValue(false);
            (roomService.getRoom as jest.Mock).mockReturnValue(room);
            jest.spyOn(service, 'removePlayerFromRoom');
            service.leavePlayerFromGame(roomId, mockSocket);

            expect(mockSocket.emit).toHaveBeenCalledWith('leftRoom', false);
            expect(service.removePlayerFromRoom).toHaveBeenCalledWith(roomId, mockSocket);
            expect(mockSocket.to(roomId).emit).toHaveBeenCalledWith('updatedPlayer', room);
        });
    });

    it('should select an avatar and update the socket data on selectedAvatar', () => {
        const avatar = avatars[0];
        avatar.isTaken = false;
        jest.spyOn(service, 'getAvatarByName').mockReturnValue(avatar);
        service.selectedAvatar(room, avatar, mockSocket, mockServer);

        expect(avatar.isTaken).toBe(true);

        expect(mockSocket.data.clickedAvatar).toBe(avatar);
    });

    it('should free up the previously selected avatar', () => {
        const clickedAvatar = avatars[0];
        clickedAvatar.isTaken = true;
        mockSocket.data.clickedAvatar = clickedAvatar;
        const getAvatarSpy = jest.spyOn(service, 'getAvatarByName').mockReturnValue(clickedAvatar);

        service.freeUpAvatar(room, mockSocket);

        expect(getAvatarSpy).toHaveBeenCalledWith(room, clickedAvatar);
        expect(clickedAvatar.isTaken).toBe(false);
    });

    it('should not free up avatar if none is clicked', () => {
        service.freeUpAvatar(room, mockSocket);
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
        jest.spyOn(roomService, 'getRoom').mockReturnValue(room);

        service.sendAvatarListToClient(mockSocket);

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
        jest.spyOn(roomService, 'getRoom').mockReturnValue(room);

        service.sendAvatarListToClient(mockSocket);

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
        jest.spyOn(service, 'sendAvatarListToClient').mockImplementation(() => {
            return avatars;
        });
        mockServer.sockets.sockets.set(mockSocket.id, mockSocket);
        service.updateAvatarsForAllClients(mockServer);

        expect(service.sendAvatarListToClient).toHaveBeenCalledTimes(1);
    });

    it('should set an unique player name', () => {
        jest.spyOn(service, 'generateUniquePlayerName').mockReturnValue('uniqueName');
        service.setUniquePlayerName(mockPlayer, mockSocket);
        expect(mockPlayer.name).toBe('uniqueName');
    });

    it('should return true if player name is taken', () => {
        const playersList: Player[] = [
            { name: 'player1', avatar: avatars[0], id: '1' } as Player,
            { name: 'player1-2', avatar: avatars[1], id: '2' } as Player,
        ];
        room.listPlayers = playersList;
        jest.spyOn(roomService, 'getRoom').mockReturnValue(room);
        const result = service.isPlayerNameTaken(mockPlayer.name, mockSocket);

        expect(result).toBe(true);
        expect(roomService.getRoom).toHaveBeenCalledWith(mockSocket);
    });

    it('should return the same name if it is unique', () => {
        const playerName = 'uniquePlayer';
        jest.spyOn(service, 'isPlayerNameTaken').mockReturnValue(false);
        const result = service.generateUniquePlayerName(playerName, mockSocket);

        expect(result).toBe(playerName);
        expect(service.isPlayerNameTaken).toHaveBeenCalledWith(playerName, mockSocket);
    });

    it('should return a name with suffix if the name is taken', () => {
        const playerName = 'player1';
        jest.spyOn(service, 'isPlayerNameTaken').mockReturnValueOnce(true).mockReturnValueOnce(false);

        const result = service.generateUniquePlayerName(playerName, mockSocket);

        expect(result).toBe('player1-2');
        expect(service.isPlayerNameTaken).toHaveBeenCalledTimes(2);
        expect(service.isPlayerNameTaken).toHaveBeenCalledWith(playerName, mockSocket);
        expect(service.isPlayerNameTaken).toHaveBeenCalledWith('player1-2', mockSocket);
    });

    describe('isCodeFormatValid', () => {
        it('should be true if the code is 4 numbers', () => {
            expect(service.isCodeFormatValid(roomId)).toBeTruthy();
        });

        it('should be false if the code is not composed of 4 numbers', () => {
            const roomCode = '12o4';
            expect(service.isCodeFormatValid(roomCode)).toBeFalsy();
        });

        it('should be false if the code length is smaller than 4 numbers', () => {
            const roomCode = '123';
            expect(service.isCodeFormatValid(roomCode)).toBeFalsy();
        });

        it('should be false if the code are not numbers', () => {
            const roomCode = 'pljd';
            expect(service.isCodeFormatValid(roomCode)).toBeFalsy();
        });
    });
});
