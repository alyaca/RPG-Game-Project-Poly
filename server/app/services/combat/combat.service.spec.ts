import { CombatService } from '@app/services/combat/combat.service';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { Player } from '@common/player';
import { Room } from '@common/room';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
/* eslint-disable @typescript-eslint/no-magic-numbers */
describe('CombatService', () => {
    let service: CombatService;
    let mockRoomService: jest.Mocked<RoomService>;
    let mockGameService: jest.Mocked<GameService>;
    let mockServer: Server;
    let mockClient: Socket;

    beforeEach(async () => {
        mockRoomService = {
            getRoom: jest.fn(),
            getTurnTimer: jest.fn().mockReturnValue({
                getTimeRemaining: jest.fn().mockReturnValue(60),
                pauseTimer: jest.fn(),
                resumeTimer: jest.fn(),
            }),
            getFightTimer: jest.fn().mockReturnValue({
                resetTimer: jest.fn(),
            }),
        } as any;

        mockGameService = {
            onTurnEnded: jest.fn(),
            stopGameTimers: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [CombatService, { provide: RoomService, useValue: mockRoomService }, { provide: GameService, useValue: mockGameService }],
        }).compile();

        service = module.get<CombatService>(CombatService);
        mockServer = {
            sockets: {
                adapter: {
                    rooms: new Map<string, Set<string>>(),
                },
                sockets: new Map<string, Socket>() as any,
            },
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as unknown as jest.Mocked<Server>;
        mockClient = {} as Socket;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // describe('startFight', () => {
    //     it('should initialize players and emit startFight event', () => {
    //         const player1 = { id: '1', attributes: { currentHp: 10 } } as Player;
    //         const player2 = { id: '2', attributes: { currentHp: 10 } } as Player;
    //         const mockRoom = { roomId: 'room1' } as Room;

    //         mockRoomService.getRoom.mockReturnValue(mockRoom);
    //         service.emitToCombatPlayers = jest.fn();
    //         service.onStartTurn = jest.fn();

    //         service.startFight(mockClient, player1, player2, mockServer);

    //         expect(service.activePlayer).toBe(player1);
    //         expect(service.defensePlayer).toBe(player2);
    //         expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, 'startFight', { player1, player2 });
    //         expect(service.onStartTurn).toHaveBeenCalledWith(mockClient, mockServer, mockRoom);
    //     });
    // });

    // describe('attackPlayer', () => {
    //     it('should decrease defensePlayer HP when attack is successful', () => {
    //         const player1 = { id: '1', attributes: { attack: 10, atkDiceMax: 6, currentHp: 10 } } as Player;
    //         const player2 = { id: '2', attributes: { defense: 5, defDiceMax: 6, currentHp: 5 } } as Player;
    //         service.activePlayer = player1;
    //         service.defensePlayer = player2;
    //         service.emitToCombatPlayers = jest.fn();
    //         service.checkIfPlayerIsDead = jest.fn().mockReturnValue(false);
    //         service.onEndTurn = jest.fn();

    //         service.attackPlayer(mockClient, mockServer);

    //         expect(player2.attributes.currentHp).toBeLessThan(5);
    //         expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, 'attackSuccess', player2);
    //     });

    //     it('should decrease activePlayer HP when defense is successful', () => {
    //         const player1 = { id: '1', attributes: { attack: 5, atkDiceMax: 6, currentHp: 10 } } as Player;
    //         const player2 = { id: '2', attributes: { defense: 10, defDiceMax: 6, currentHp: 10 } } as Player;
    //         service.activePlayer = player1;
    //         service.defensePlayer = player2;
    //         service.emitToCombatPlayers = jest.fn();
    //         service.checkIfPlayerIsDead = jest.fn().mockReturnValue(false);
    //         service.onEndTurn = jest.fn();

    //         service.attackPlayer(mockClient, mockServer);

    //         expect(player1.attributes.currentHp).toBeLessThan(10);
    //         expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, 'attackFail', player1);
    //     });
    // });

    // describe('checkIfPlayerIsDead', () => {
    //     it('should return true and reset HP if a player dies', () => {
    //         const player1 = { id: '1', attributes: { currentHp: 0, totalHp: 10 }, victories: 0 } as Player;
    //         const player2 = { id: '2', attributes: { currentHp: 10, totalHp: 10 }, victories: 0 } as Player;
    //         const mockRoom = { roomId: 'room1', listPlayers: [player1, player2] } as Room;

    //         mockRoomService.getRoom.mockReturnValue(mockRoom);
    //         service.emitToCombatPlayers = jest.fn();
    //         service.checkEndGame = jest.fn();
    //         mockRoomService.getTurnTimer = jest.fn().mockReturnValue({
    //             resumeTimer: jest.fn((callback: (time: number) => void) => callback(10)),
    //         });

    //         const isDead = service.checkIfPlayerIsDead(mockClient, player1, player2, mockServer);

    //         expect(isDead).toBe(true);
    //         expect(player1.attributes.currentHp).toBe(player1.attributes.totalHp);
    //         expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, 'playerDead', player1);
    //     });
    // });

    // describe('getRandom', () => {
    //     it('should return a random number between 1 and max', () => {
    //         const max = 10;
    //         const randomValue = service.getRandom(max);
    //         expect(randomValue).toBeGreaterThanOrEqual(1);
    //         expect(randomValue).toBeLessThanOrEqual(max);
    //     });
    // });
    // describe('getRoomSockets', () => {
    //     it('should return the set of socket IDs in the specified room', () => {
    //         const roomId = 'room1';
    //         const socketsSet = new Set<string>(['socket1', 'socket2']);
    //         mockServer.sockets.adapter.rooms.set(roomId, socketsSet);

    //         const result = service.getRoomSockets(roomId, mockServer);
    //         expect(result).toEqual(socketsSet);
    //     });
    // });

    // describe('getSpecificSocket', () => {
    //     it('should return the specified socket if it exists in the room', () => {
    //         const roomId = 'room1';
    //         const socketId = 'socket1';
    //         const mockSocket = { id: socketId } as Socket;

    //         mockServer.sockets.adapter.rooms.set(roomId, new Set<string>([socketId]));
    //         mockServer.sockets.sockets.set(socketId, mockSocket);

    //         const result = service.getSpecificSocket(socketId, roomId, mockServer);
    //         expect(result).toBe(mockSocket);
    //     });
    // });

    // describe('emitToCombatPlayers', () => {
    //     it('should emit the event to both activePlayer and defensePlayer', () => {
    //         const event = 'testEvent';
    //         const data = { key: 'value' };
    //         service.activePlayer = { id: 'activePlayerId' } as Player;
    //         service.defensePlayer = { id: 'defensePlayerId' } as Player;

    //         service.emitToCombatPlayers(mockServer, event, data);

    //         expect(mockServer.to).toHaveBeenCalledWith(service.activePlayer.id);
    //         expect(mockServer.to).toHaveBeenCalledWith(service.defensePlayer.id);
    //         expect(mockServer.to(service.activePlayer.id).emit).toHaveBeenCalledWith(event, data);
    //         expect(mockServer.to(service.defensePlayer.id).emit).toHaveBeenCalledWith(event, data);
    //     });
    // });

    // describe('isEvasionSuccessful', () => {
    //     it('should return false when evasion random chance is greater than EVASION_LUCK', () => {
    //         jest.spyOn(service, 'getRandom').mockReturnValue(0.4 + 1);

    //         const result = service.isEvasionSuccessful();
    //         expect(result).toBe(false);
    //     });

    //     it('should return false when evasion random chance is less than or equal to EVASION_LUCK', () => {
    //         jest.spyOn(service, 'getRandom').mockReturnValue(0.4 - 1);

    //         const result = service.isEvasionSuccessful();
    //         expect(result).toBe(false);
    //     });
    // });

    // describe('checkEndGame', () => {
    //     it('should not emit endGame if no player has reached the victory threshold', () => {
    //         const player1 = { id: '1', victories: 2 - 1 } as Player;
    //         const player2 = { id: '2', victories: 2 - 1 } as Player;
    //         const room = { roomId: 'room1', listPlayers: [player1, player2] } as Room;

    //         service.emitToCombatPlayers = jest.fn();

    //         service.checkEndGame([player1, player2], room, mockServer);

    //         expect(mockGameService.stopGameTimers).not.toHaveBeenCalled();
    //     });
    // });
});
