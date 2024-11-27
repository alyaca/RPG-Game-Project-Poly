import { Timer } from '@app/classes/timer/timer';
import { END_COMBAT_DELAY, EVASION_SUCCESS_RATE } from '@app/constants';
import { mockCombatInfos, mockCombatPlayers } from '@app/mocks/mock-combat-infos';
import { mockPlayers } from '@app/mocks/mock-players';
import { mockRooms } from '@app/mocks/mock-room';
import { CombatService } from '@app/services/combat/combat.service';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
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
    let mockLogsService: jest.Mocked<GameLogsService>;
    let mockServer: Server;
    let mockClient: Socket;
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
            placeItemsOnGround : jest.fn(),
        } as unknown as jest.Mocked<GameService>;

        mockLogsService = {
            createLog: jest.fn(),
            getGameLog: jest.fn(),
            sendPlayerLog: jest.fn(),
            sendEndGameLog: jest.fn(),
            sendGlobalCombatLog: jest.fn(),
            sendCombatActionLog: jest.fn(),
            sendCombatCombatResultLog: jest.fn(),
        } as unknown as jest.Mocked<GameLogsService>;

        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            sockets: {
                sockets: new Map(),
            },
        } as unknown as jest.Mocked<Server>;

        mockClient = { data: { id: 'admin1234' }, to: jest.fn().mockReturnThis(), emit: jest.fn() } as unknown as Socket;
        room = mockRooms[0];
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatService,
                { provide: RoomService, useValue: mockRoomService },
                { provide: GameService, useValue: mockGameService },
                { provide: GameLogsService, useValue: mockLogsService },
            ],
        }).compile();

        service = module.get<CombatService>(CombatService);
        service.combatInfos.set(room.roomId, mockCombatInfos);
        mockRoomService.getRoom.mockReturnValue(room);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('emitToCombatPlayers', () => {
        it('should emit the event to both activePlayer and defensePlayer', () => {
            const event = 'testEvent';
            const data = { key: 'value' };
            service.emitToCombatPlayers(mockServer, mockCombatPlayers, event, data);

            expect(mockServer.to).toHaveBeenCalledWith(mockCombatPlayers.attacker.id);
            expect(mockServer.to).toHaveBeenCalledWith(mockCombatPlayers.defender.id);
            expect(mockServer.to(mockCombatPlayers.attacker.id).emit).toHaveBeenCalledWith(event, data);
            expect(mockServer.to(mockCombatPlayers.defender.id).emit).toHaveBeenCalledWith(event, data);
        });
    });

    describe('startFight', () => {
        it('should initialize players and emit startFight event', () => {
            const isPlayer1Active = true;
            service.emitToCombatPlayers = jest.fn();
            service.onStartTurn = jest.fn();
            service['handlePlayerOnIce'] = jest.fn();

            service.startFight(mockClient, mockCombatPlayers.attacker, mockCombatPlayers.defender, isPlayer1Active, mockServer);

            expect(service.combatInfos.get(room.roomId)).toEqual(mockCombatInfos);
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
        service.emitToCombatPlayers = jest.fn();
        service.attackPlayer = jest.fn();
        room.listPlayers.push(mockPlayers[0]);
        service.onStartTurn(mockClient, mockServer, room);
        fightTimerCallback(remainingTime);
        expect(service.emitToCombatPlayers).toHaveBeenCalled();
        fightTimerCallback(0);
    });

    it('should switch attacker onEndTurn', () => {
        service.emitToCombatPlayers = jest.fn();
        service.onStartTurn = jest.fn();

        service.onEndTurn(mockClient, mockServer, room);

        expect(service.combatInfos.get(room.roomId)).toBe(mockCombatInfos);
        expect(service.emitToCombatPlayers).toHaveBeenCalled();
        expect(service.onStartTurn).toHaveBeenCalledWith(mockClient, mockServer, room);
    });

    describe('attackPlayer', () => {
        it('should decrease defensePlayer HP when attack is successful', () => {
            const combatValue = { attackValues: { total: 10, diceValue: 4 }, defenseValues: { total: 4, diceValue: 1 } };
            service.getCombatValues = jest.fn().mockReturnValue(combatValue);
            service.emitToCombatPlayers = jest.fn();
            service.checkIfPlayerIsDead = jest.fn().mockReturnValue(false);
            service.onEndTurn = jest.fn();

            service.attackPlayer(mockClient, mockServer);

            expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, mockCombatPlayers, 'attackValues', combatValue);
            expect(service.emitToCombatPlayers).toHaveBeenCalledWith(
                mockServer,
                mockCombatPlayers,
                'attackSuccess',
                mockCombatInfos.combatPlayers.attacker,
            );
            expect(service.onEndTurn).toHaveBeenCalled();
        });

        // add the fact that a player can have Achilles' armor or Xiphos in his inventory
        it('should decrease activePlayer HP when defense is successful', () => {
            const combatValue = { attackValues: 3, defenseValues: 10 };
            service.getCombatValues = jest.fn().mockReturnValue(combatValue);
            service.emitToCombatPlayers = jest.fn();
            service.checkIfPlayerIsDead = jest.fn().mockReturnValue(false);
            service.onEndTurn = jest.fn();

            service.attackPlayer(mockClient, mockServer);
            expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, mockCombatPlayers, 'attackValues', combatValue);
            expect(service.emitToCombatPlayers).toHaveBeenCalledWith(
                mockServer,
                mockCombatPlayers,
                'attackFail',
                mockCombatInfos.combatPlayers.attacker,
            );
        });
    });

    describe('checkIfPlayerIsDead', () => {
        it('should return true and continue turn when player has no hp', () => {
            const player1 = { id: '1', attributes: { currentHp: 0, totalHp: 10 }, victories: 0 } as Player;
            const player2 = { id: '2', attributes: { currentHp: 10, totalHp: 10 }, victories: 0 } as Player;

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
            const player1 = { id: '1', attributes: { currentHp: 6, totalHp: 10 }, victories: 0 } as Player;
            const player2 = { id: '2', attributes: { currentHp: 10, totalHp: 10 }, victories: 0 } as Player;

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
            const player1 = { id: '1', victories: 2 } as Player;
            service.checkEndGame(player1, room, mockServer);

            expect(mockGameService.stopGameTimers).not.toHaveBeenCalled();
            expect(mockServer.to(room.roomId).emit).not.toHaveBeenCalled();
        });
        it('should emit endGame if player has reached the victory threshold', () => {
            const player = { id: '1', victories: 3 } as Player;
            service.checkEndGame(player, room, mockServer);

            expect(mockGameService.stopGameTimers).toHaveBeenCalledWith(room);
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('endGame', player);
        });
    });
    describe('evadingPlayer', () => {
        it('should continue turn if evasion is successful', () => {
            service.emitToCombatPlayers = jest.fn();
            service.continueTurn = jest.fn();
            jest.spyOn(service, 'isEvasionSuccessful').mockReturnValue(true);

            service.evadingPlayer(mockClient, mockServer);

            expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, mockCombatPlayers, 'evasionSuccess', {
                listPlayers: room.listPlayers,
                player: mockCombatPlayers.attacker,
            });
            expect(service.continueTurn).toHaveBeenCalledWith(mockClient, mockServer);
            expect(mockLogsService.sendCombatActionLog).toHaveBeenCalled();
            expect(mockLogsService.sendGlobalCombatLog).toHaveBeenCalled();
        });
        it('should end turn if evasion is not successful', () => {
            service.emitToCombatPlayers = jest.fn();
            service.onEndTurn = jest.fn();
            jest.spyOn(service, 'isEvasionSuccessful').mockReturnValue(false);

            service.evadingPlayer(mockClient, mockServer);

            expect(mockLogsService.sendCombatActionLog).toHaveBeenCalled();
            expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, mockCombatPlayers, 'evasionFail', mockCombatPlayers.attacker);
            expect(service.onEndTurn).toHaveBeenCalledWith(mockClient, mockServer, room);
        });
    });

    it('should addVictory combat finish', () => {
        const player1 = { id: '1', attributes: { currentHp: 0, totalHp: 10 }, victories: 0 } as Player;
        const player2 = { id: '2', attributes: { currentHp: 10, totalHp: 10 }, victories: 0 } as Player;

        service.emitToCombatPlayers = jest.fn();
        service.addVictory = jest.fn();

        service.combatFinish(mockClient, player1, player2, mockServer);

        expect(mockClient.to(room.roomId).emit).toHaveBeenCalledWith('playerDead', player1);
        expect(service.addVictory).toHaveBeenCalledWith(room, player2, mockServer);
    });

    it('should stop the fight timer and reset each player hp', () => {
        const player1 = { id: '1', attributes: { currentHp: 0 } } as Player;
        const player2 = { id: '2', attributes: { currentHp: 3 } } as Player;
        room.listPlayers.push(player1);
        room.listPlayers.push(player2);

        service.resetCombatState(room);

        expect(mockRoomService.getFightTimer).toHaveBeenCalledWith(room.roomId);
        expect(mockRoomService.getFightTimer(room.roomId).stopTimer).toHaveBeenCalled();
    });

    it('should call onTurnEnded if time remaining is 0 or less', () => {
        jest.useFakeTimers();
        const player = mockPlayers[0];
        mockGameService.getActivePlayer.mockReturnValue(player);
        const mockSocket = { id: player.id } as Socket;
        mockServer.sockets.sockets.set(player.id, mockSocket);
        mockRoomService.getTurnTimer.mockReturnValue({
            resumeTimer: jest.fn((callback: (timeRemaining: number) => void) => {
                callback(0);
            }),
        } as unknown as Timer);
        service.resetCombatState = jest.fn();

        service.continueTurn(mockClient, mockServer);
        jest.advanceTimersByTime(END_COMBAT_DELAY);

        expect(mockGameService.onTurnEnded).toHaveBeenCalledWith(mockSocket, mockServer);
        jest.useRealTimers();
    });
});
