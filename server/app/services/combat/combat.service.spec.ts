import { Timer } from '@app/classes/timer/timer';
import { EVASION_SUCCESS_RATE } from '@app/constants';
import { mockPlayers } from '@app/mocks/mock-players';
import { mockRooms } from '@app/mocks/mock-room';
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
    let attacker: Player;
    let defender: Player;
    let room: Room;
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
                stopTimer: jest.fn(),
            }),
        } as unknown as jest.Mocked<RoomService>;

        mockGameService = {
            onTurnEnded: jest.fn(),
            stopGameTimers: jest.fn(),
            getActivePlayer: jest.fn(),
        } as unknown as jest.Mocked<GameService>;

        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
        } as unknown as jest.Mocked<Server>;

        mockClient = { data: { id: 'admin1234' }, to: jest.fn().mockReturnThis(), emit: jest.fn() } as unknown as Socket;
        mockClient = { data: { id: 'admin1234' }, to: jest.fn().mockReturnThis(), emit: jest.fn() } as unknown as Socket;
        attacker = { id: 'attackerId', attributes: { currentHp: 10, totalHp: 10, evasion: 2 } } as Player;
        defender = { id: 'defenderId', attributes: { currentHp: 10, totalHp: 10 } } as Player;
        room = mockRooms[0];
        const module: TestingModule = await Test.createTestingModule({
            providers: [CombatService, { provide: RoomService, useValue: mockRoomService }, { provide: GameService, useValue: mockGameService }],
        }).compile();

        service = module.get<CombatService>(CombatService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('emitToCombatPlayers', () => {
        it('should emit the event to both activePlayer and defensePlayer', () => {
            const event = 'testEvent';
            const data = { key: 'value' };
            service.attacker = attacker;
            service.defender = defender;

            service.emitToCombatPlayers(mockServer, event, data);

            expect(mockServer.to).toHaveBeenCalledWith(service.attacker.id);
            expect(mockServer.to).toHaveBeenCalledWith(service.defender.id);
            expect(mockServer.to(service.attacker.id).emit).toHaveBeenCalledWith(event, data);
            expect(mockServer.to(service.defender.id).emit).toHaveBeenCalledWith(event, data);
        });
    });

    describe('startFight', () => {
        it('should initialize players and emit startFight event', () => {
            const isPlayer1Active = true;
            mockRoomService.getRoom.mockReturnValue(room);
            service.emitToCombatPlayers = jest.fn();
            service.onStartTurn = jest.fn();

            service.startFight(mockClient, attacker, defender, isPlayer1Active, mockServer);

            expect(service.attacker).toBe(attacker);
            expect(service.defender).toBe(defender);
            expect(service.emitToCombatPlayers).toHaveBeenCalled();
            expect(service.onStartTurn).toHaveBeenCalledWith(mockClient, mockServer, room);
        });
    });

    it('should reset timer and emit to players onStartTurn', () => {
        const remainingTime = 2;
        const fightTimerCallback = jest.fn();
        const resetTimerMock = jest.fn((time, callback) => {
            fightTimerCallback.mockImplementation(callback);
        });
        const fightTimer = {
            resetTimer: resetTimerMock,
        } as unknown as Timer;
        jest.spyOn(mockRoomService, 'getFightTimer').mockReturnValue(fightTimer);
        service.attacker = attacker;
        service.emitToCombatPlayers = jest.fn();
        service.attackPlayer = jest.fn();
        room.listPlayers.push(mockPlayers[0]);
        service.onStartTurn(mockClient, mockServer, room);
        fightTimerCallback(remainingTime);
        expect(service.emitToCombatPlayers).toHaveBeenCalled();
        fightTimerCallback(0);
    });

    it('should switch attacker onEndTurn', () => {
        service.attacker = attacker;
        service.defender = defender;

        service.emitToCombatPlayers = jest.fn();
        service.onStartTurn = jest.fn();

        service.onEndTurn(mockClient, mockServer, mockRooms[0]);

        expect(service.attacker).toBe(defender);
        expect(service.defender).toBe(attacker);
        expect(service.emitToCombatPlayers).toHaveBeenCalled();
        expect(service.onStartTurn).toHaveBeenCalledWith(mockClient, mockServer, mockRooms[0]);
    });

    describe('attackPlayer', () => {
        it('should decrease defensePlayer HP when attack is successful', () => {
            const player1 = { id: '1', attributes: { attack: 10, atkDiceMax: 6, currentHp: 10 } } as Player;
            const player2 = { id: '2', attributes: { defense: 5, defDiceMax: 6, currentHp: 5 } } as Player;
            service.attacker = player1;
            service.defender = player2;
            service.emitToCombatPlayers = jest.fn();
            service.addDmgStats = jest.fn();
            service.checkIfPlayerIsDead = jest.fn().mockReturnValue(false);
            service.onEndTurn = jest.fn();
            service.getRandomValue = jest.fn().mockReturnValueOnce(5).mockReturnValueOnce(2);

            service.attackPlayer(mockClient, mockServer);

            expect(player2.attributes.currentHp).toBeLessThan(5);
            expect(service.emitToCombatPlayers).toHaveBeenCalled();
            expect(service.onEndTurn).toHaveBeenCalled();
        });

        it('should decrease activePlayer HP when defense is successful', () => {
            const player1 = { id: '1', attributes: { attack: 4, atkDiceMax: 6, currentHp: 10 } } as Player;
            const player2 = { id: '2', attributes: { defense: 4, defDiceMax: 6, currentHp: 10 } } as Player;
            service.attacker = player1;
            service.defender = player2;
            service.emitToCombatPlayers = jest.fn();
            service.checkIfPlayerIsDead = jest.fn().mockReturnValue(false);
            service.onEndTurn = jest.fn();
            service.getRandomValue = jest.fn().mockReturnValueOnce(2).mockReturnValueOnce(4);

            service.attackPlayer(mockClient, mockServer);

            expect(player2.attributes.currentHp).toBe(10);
            expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, 'attackFail', player1);
        });
    });

    describe('checkIfPlayerIsDead', () => {
        it('should return true and reset HP if a player dies', () => {
            const player1 = { id: '1', attributes: { currentHp: 0, totalHp: 10 }, postGameStats: { victories: 0 } } as Player;
            const player2 = { id: '2', attributes: { currentHp: 10, totalHp: 10 }, postGameStats: { victories: 0 } } as Player;
            // const mockRoom = { roomId: 'room1', listPlayers: [player1, player2] } as Room;

            mockRoomService.getRoom.mockReturnValue(room);
            mockGameService.getActivePlayer.mockReturnValue(player2);
            service.continueTurn = jest.fn();
            service.combatFinish = jest.fn();
            service.replacePlayerOnSpawnPoint = jest.fn();

            const isDead = service.checkIfPlayerIsDead(mockClient, player1, player2, mockServer);

            expect(isDead).toBe(true);
            expect(service.replacePlayerOnSpawnPoint).toHaveBeenCalled();
            expect(service.combatFinish).toHaveBeenCalled();
            expect(service.continueTurn).toHaveBeenCalledWith(mockClient, mockServer);
        });
        it('should return false when player has hp', () => {
            const player1 = { id: '1', attributes: { currentHp: 6, totalHp: 10 }, postGameStats: { victories: 0 } } as Player;
            const player2 = { id: '2', attributes: { currentHp: 10, totalHp: 10 }, postGameStats: { victories: 0 } } as Player;

            mockRoomService.getRoom.mockReturnValue(room);
            mockGameService.getActivePlayer.mockReturnValue(player2);
            service.continueTurn = jest.fn();
            service.combatFinish = jest.fn();
            service.replacePlayerOnSpawnPoint = jest.fn();

            const isDead = service.checkIfPlayerIsDead(mockClient, player2, player1, mockServer);

            expect(isDead).toBe(false);
            expect(service.replacePlayerOnSpawnPoint).not.toHaveBeenCalled();
            expect(service.combatFinish).not.toHaveBeenCalled();
            expect(service.continueTurn).not.toHaveBeenCalledWith(mockClient, mockServer);
        });
    });

    describe('getRandom', () => {
        it('should return a random number between 1 and max', () => {
            const max = 10;
            const randomValue = service.getRandomValue(max);
            expect(randomValue).toBeGreaterThanOrEqual(1);
            expect(randomValue).toBeLessThanOrEqual(max);
        });
    });

    describe('isEvasionSuccessful', () => {
        it('should return true when Math.random() is less than EVASION_SUCCESS_RATE', () => {
            jest.spyOn(Math, 'random').mockReturnValue(EVASION_SUCCESS_RATE - 0.1);

            const result = service.isEvasionSuccessful();
            expect(result).toBe(true);
        });

        it('should return false when Math.random() is equal to or greater than EVASION_SUCCESS_RATE', () => {
            jest.spyOn(Math, 'random').mockReturnValue(EVASION_SUCCESS_RATE + 0.1);

            const result = service.isEvasionSuccessful();
            expect(result).toBe(false);
        });
    });

    describe('checkEndGame', () => {
        it('should not emit endGame if no player has reached the victory threshold', () => {
            const player1 = { id: '1', postGameStats: { victories: 2 } } as Player;
            service.checkEndGame(player1, room, mockServer);

            expect(mockGameService.stopGameTimers).not.toHaveBeenCalled();
            expect(mockServer.to(room.roomId).emit).not.toHaveBeenCalled();
        });
        it('should emit endGame if player has reached the victory threshold', () => {
            const winner = { id: '1', postGameStats: { victories: 3 } } as Player;
            service.checkEndGame(winner, room, mockServer);

            expect(mockGameService.stopGameTimers).toHaveBeenCalledWith(room);
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('endGame', { winner, room });
        });
    });
    describe('evadingPlayer', () => {
        it('should continue turn if evasion is successful', () => {
            const player = { id: '1', attributes: { attack: 10, atkDiceMax: 6, currentHp: 10 } } as Player;

            mockRoomService.getRoom.mockReturnValue(mockRooms[0]);
            service.emitToCombatPlayers = jest.fn();
            service.continueTurn = jest.fn();
            service.addDraws = jest.fn();
            service.attacker = attacker;
            jest.spyOn(service, 'isEvasionSuccessful').mockReturnValue(true);

            service.evadingPlayer(mockClient, player, mockServer);

            expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, 'evasionSuccess', player);
            expect(service.continueTurn).toHaveBeenCalledWith(mockClient, mockServer);
        });
        it('should end turn if evasion is not successful', () => {
            const player = { id: '1', attributes: { attack: 10, atkDiceMax: 6, currentHp: 10 } } as Player;
            service.attacker = attacker;
            mockRoomService.getRoom.mockReturnValue(mockRooms[0]);
            service.emitToCombatPlayers = jest.fn();
            service.onEndTurn = jest.fn();
            jest.spyOn(service, 'isEvasionSuccessful').mockReturnValue(false);

            service.evadingPlayer(mockClient, player, mockServer);

            expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, 'evasionFail', player);
            expect(service.onEndTurn).toHaveBeenCalledWith(mockClient, mockServer, mockRooms[0]);
        });
    });

    it('should addVictory combat finish', () => {
        const player1 = { id: '1', attributes: { currentHp: 0, totalHp: 10 }, postGameStats: { victories: 0 } } as Player;
        const player2 = { id: '2', attributes: { currentHp: 10, totalHp: 10 }, postGameStats: { victories: 0 } } as Player;

        mockRoomService.getRoom.mockReturnValue(mockRooms[0]);
        service.emitToCombatPlayers = jest.fn();
        service.addVictory = jest.fn();
        service.addDefeat = jest.fn();

        service.combatFinish(mockClient, player1, player2, mockServer);

        // expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, 'playerDead', player1);
        expect(mockClient.to(mockRooms[0].roomId).emit).toHaveBeenCalledWith('playerDead', player1);
        expect(service.addVictory).toHaveBeenCalledWith(mockRooms[0], player2, mockServer);
    });

    it('should stop the fight timer and reset each player hp', () => {
        const player1 = { id: '1', attributes: { currentHp: 0 } } as Player;
        const player2 = { id: '2', attributes: { currentHp: 3 } } as Player;
        room.listPlayers.push(player1);
        room.listPlayers.push(player2);

        service.combatEnded(room);

        expect(mockRoomService.getFightTimer).toHaveBeenCalledWith(room.roomId);
        expect(mockRoomService.getFightTimer(room.roomId).stopTimer).toHaveBeenCalled();
    });

    it('should call onTurnEnded if time remaining is 0 or less', () => {
        mockRoomService.getTurnTimer.mockReturnValue({
            resumeTimer: jest.fn((callback: (timeRemaining: number) => void) => {
                callback(0);
            }),
        } as unknown as Timer);
        mockRoomService.getRoom.mockReturnValue(mockRooms[0]);
        service.combatEnded = jest.fn();

        service.continueTurn(mockClient, mockServer);

        expect(mockGameService.onTurnEnded).toHaveBeenCalledWith(mockClient, mockServer);
    });
});
