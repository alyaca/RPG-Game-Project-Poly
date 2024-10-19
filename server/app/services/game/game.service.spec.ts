import { mockRooms } from '@app/mocks/mock-room';
import { avatars } from '@common/avatarsInfo';
import { Player } from '@common/player';
import { Room } from '@common/room';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';
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
        service.createPlayer(room, mockPlayer, mockSocket);

        expect(mockSocket.data.username).toBe(mockPlayer.name);
        expect(room.listPlayers).toContainEqual(mockPlayer);
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
        jest.spyOn(service, 'sendAvatarListToClient').mockImplementation(() => {});
        mockServer.sockets.sockets.set(mockSocket.id, mockSocket);
        service.updateAvatarsForAllClients(mockServer);

        expect(service.sendAvatarListToClient).toHaveBeenCalledTimes(1);
    });
});
