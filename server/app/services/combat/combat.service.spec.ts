import { Timer } from '@app/classes/timer/timer';
import { END_COMBAT_DELAY, EVASION_SUCCESS_RATE, ICE_TILE_PENALTY_VALUE, TileType } from '@app/constants';
import { mockAttacker, mockCombatInfos, mockCombatPlayers, mockDefender } from '@app/mocks/mock-combat-infos';
import { mockGame } from '@app/mocks/mock-game';
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

        mockClient = { id: 'admin', data: { id: 'admin1234' }, to: jest.fn().mockReturnThis(), emit: jest.fn() } as unknown as Socket;
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
        mockRoomService.getRoom = jest.fn().mockReturnValue(room);
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
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

    it('should reset timer to 3 seconds and emit to players onStartTurn', () => {
        const attacker = service.combatInfos.get(room.roomId).combatPlayers.attacker;
        attacker.attributes.evasion = 0;
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
            service['checkIfPlayerIsDead'] = jest.fn().mockReturnValue(false);
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

        it('should decrease activePlayer HP when defense is successful', () => {
            const combatValue = { attackValues: 3, defenseValues: 10 };
            service.getCombatValues = jest.fn().mockReturnValue(combatValue);
            service.emitToCombatPlayers = jest.fn();
            service['checkIfPlayerIsDead'] = jest.fn().mockReturnValue(false);
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

    it('should calculate dice value and set result in combatPlayers', () => {
        const attackDice = 2;
        const defenseDice = 5;
        const players = service.combatInfos.get(room.roomId).combatPlayers;
        const expectedAttackValues = { total: players.attacker.attributes.attack + attackDice, diceValue: attackDice };
        const expectedDefenseValues = { total: players.defender.attributes.defense + defenseDice, diceValue: defenseDice };
        const expectedResult = { attackValues: expectedAttackValues, defenseValues: expectedDefenseValues };
        service['getRandomValue'] = jest.fn().mockReturnValueOnce(attackDice).mockReturnValue(defenseDice);

        const result = service.getCombatValues(mockCombatPlayers);
        expect(result).toEqual(expectedResult);
        expect(players.combatResultDetails).toEqual(expectedResult);
    });

    describe('checkIfPlayerIsDead', () => {
        it('should return true and continue turn when player has no hp', () => {
            const player1 = { id: '1', attributes: { currentHp: 0, totalHp: 10 }, victories: 0 } as Player;
            const player2 = { id: '2', attributes: { currentHp: 10, totalHp: 10 }, victories: 0 } as Player;

            mockGameService.getActivePlayer.mockReturnValue(player2);
            service.manageTurnAfterCombat = jest.fn();
            service.combatFinish = jest.fn();
            service['replacePlayerOnSpawnPoint'] = jest.fn();

            const isDead = service['checkIfPlayerIsDead'](mockClient, player1, player2, mockServer);

            expect(isDead).toBe(true);
            expect(service['replacePlayerOnSpawnPoint']).toHaveBeenCalled();
            expect(service.combatFinish).toHaveBeenCalled();
            expect(service.manageTurnAfterCombat).toHaveBeenCalledWith(mockClient, player1, player2, mockServer);
        });
        it('should return false when player has hp', () => {
            const player1 = { id: '1', attributes: { currentHp: 6, totalHp: 10 }, victories: 0 } as Player;
            const player2 = { id: '2', attributes: { currentHp: 10, totalHp: 10 }, victories: 0 } as Player;

            mockGameService.getActivePlayer.mockReturnValue(player2);
            service.manageTurnAfterCombat = jest.fn();
            service.combatFinish = jest.fn();
            service['replacePlayerOnSpawnPoint'] = jest.fn();

            const isDead = service['checkIfPlayerIsDead'](mockClient, player2, player1, mockServer);

            expect(isDead).toBe(false);
            expect(service['replacePlayerOnSpawnPoint']).not.toHaveBeenCalled();
            expect(service.combatFinish).not.toHaveBeenCalled();
            expect(service.manageTurnAfterCombat).not.toHaveBeenCalledWith(mockClient, player2, player1, mockServer);
        });
    });

    describe('manageTurnAfterCombat', () => {
        it('should continue turn if active player wins combat', () => {
            mockGameService.getActivePlayer = jest.fn().mockReturnValue(mockPlayers[0]);
            room.navigation.findReachableTiles = jest.fn().mockReturnValue([]);

            service.manageTurnAfterCombat(mockClient, mockDefender, mockAttacker, mockServer);

            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('reachableTiles', []);
        });

        it('should end turn if active player loses combat', () => {
            jest.useFakeTimers();
            mockGameService.getActivePlayer = jest.fn().mockReturnValue(mockPlayers[0]);
            room.navigation.findReachableTiles = jest.fn().mockReturnValue([]);
            mockGameService.onTurnEnded = jest.fn();
            service['resetCombatState'] = jest.fn();

            service.manageTurnAfterCombat(mockClient, mockPlayers[0], mockAttacker, mockServer);
            jest.advanceTimersByTime(END_COMBAT_DELAY);

            expect(service['resetCombatState']).toHaveBeenCalledWith(room);
            expect(mockServer.to(room.roomId).emit).not.toHaveBeenCalledWith('reachableTiles', []);
            expect(mockGameService.onTurnEnded).toHaveBeenCalled();
        });
    });

    describe('getRandom', () => {
        it('should return a random number between 1 and max', () => {
            const max = 10;
            const randomValue = service['getRandomValue'](max);
            expect(randomValue).toBeGreaterThanOrEqual(1);
            expect(randomValue).toBeLessThanOrEqual(max);
        });
    });

    describe('isEvasionSuccessful', () => {
        it('should return true when Math.random() is less than EVASION_SUCCESS_RATE', () => {
            jest.spyOn(Math, 'random').mockReturnValue(EVASION_SUCCESS_RATE - 0.1);

            const result = service['isEvasionSuccessful']();
            expect(result).toBe(true);
        });

        it('should return false when Math.random() is equal to or greater than EVASION_SUCCESS_RATE', () => {
            jest.spyOn(Math, 'random').mockReturnValue(EVASION_SUCCESS_RATE + 0.1);

            const result = service['isEvasionSuccessful']();
            expect(result).toBe(false);
        });
    });

    describe('checkEndGame', () => {
        it('should not emit endGame if no player has reached the victory threshold', () => {
            const player1 = { id: '1', victories: 2 } as Player;
            service['checkEndGame'](player1, room, mockServer);

            expect(mockGameService.stopGameTimers).not.toHaveBeenCalled();
            expect(mockServer.to(room.roomId).emit).not.toHaveBeenCalled();
        });
        it('should emit endGame if player has reached the victory threshold', () => {
            const player = { id: '1', victories: 3 } as Player;
            service['checkEndGame'](player, room, mockServer);

            expect(mockGameService.stopGameTimers).toHaveBeenCalledWith(room);
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('endGame', player);
        });
    });
    describe('evadingPlayer', () => {
        it('should continue turn if evasion is successful', () => {
            service.emitToCombatPlayers = jest.fn();
            service.continueTurn = jest.fn();
            service['isEvasionSuccessful'] = jest.fn().mockReturnValue(true);

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
            service['isEvasionSuccessful'] = jest.fn().mockReturnValue(false);

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
        service['addVictory'] = jest.fn();

        service.combatFinish(mockClient, player1, player2, mockServer);

        expect(mockClient.to(room.roomId).emit).toHaveBeenCalledWith('playerDead', player1);
        expect(service['addVictory']).toHaveBeenCalledWith(room, player2, mockServer);
    });

    it('should stop the fight timer and reset each player hp', () => {
        const player1 = { id: '1', attributes: { currentHp: 0 } } as Player;
        const player2 = { id: '2', attributes: { currentHp: 3 } } as Player;
        room.listPlayers.push(player1);
        room.listPlayers.push(player2);

        service['resetCombatState'](room);

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
        service['resetCombatState'] = jest.fn();

        service.continueTurn(mockClient, mockServer);
        jest.advanceTimersByTime(END_COMBAT_DELAY);

        expect(mockGameService.onTurnEnded).toHaveBeenCalledWith(mockSocket, mockServer);
    });

    it('should reset combat state when a player disconnects while in combat', () => {
        service['getOpponent'] = jest.fn().mockReturnValue(mockPlayers[0]);
        mockLogsService.sendPlayerLog = jest.fn();
        service['defaultCombatWin'] = jest.fn();
        service.continueTurn = jest.fn();
        service['resetCombatState'] = jest.fn();

        service.disconnectedPlayer(mockClient, mockServer);

        expect(service.continueTurn).toHaveBeenCalled();
        expect(service['resetCombatState']).toHaveBeenCalledWith(room);
    });

    describe('isInCombat', () => {
        let players;
        beforeEach(() => {
            players = service.combatInfos.get(room.roomId).combatPlayers;
            mockClient.data.roomCode = room.roomId;
        });

        it('should return false if data is undefined', () => {
            mockClient.data = undefined;
            const result = service.isInCombat(mockClient);
            expect(result).toBe(false);
        });

        it('should return false if no combat in room', () => {
            mockClient.data.roomCode = 'noCode';
            const result = service.isInCombat(mockClient);
            expect(result).toBe(false);
        });

        it('should return false if attacker undefined', () => {
            players.defender = mockDefender;
            players.attacker = undefined;
            const result = service.isInCombat(mockClient);
            expect(result).toBe(false);
        });

        it('should return false if defender undefined', () => {
            players.attacker = mockAttacker;
            players.defender = undefined;
            const result = service.isInCombat(mockClient);
            expect(result).toBe(false);
        });

        it('should return true if player is the attacker in combat', () => {
            players.attacker = mockAttacker;
            players.defender = mockDefender;
            players.attacker.id = mockClient.id;
            const result = service.isInCombat(mockClient);
            expect(result).toBe(true);
        });

        it('should return true if player is the defender in combat', () => {
            players.attacker = mockAttacker;
            players.defender = mockDefender;
            players.attacker.id = mockAttacker.id;
            const result = service.isInCombat(mockClient);
            expect(result).toBe(true);
        });
    });

    it('should add victory', () => {
        const winner = room.listPlayers.find((p) => p.id === mockPlayers[0].id);
        service['checkEndGame'] = jest.fn();
        service['addVictory'](room, mockPlayers[0], mockServer);
        expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('combatEnd', { listPlayers: room.listPlayers, player: winner });
    });

    describe('replacePlayerOnSpawnPoint', () => {
        it('should return early if player not in room', () => {
            service['replacePlayerOnSpawnPoint'](mockPlayers[2], mockClient, mockServer);
        });

        it('should put player on its spawn if available', () => {
            const playerToReplace = mockPlayers[0];
            const oldPosition = playerToReplace.position;
            service['checkSpawnPointAvailability'] = jest.fn().mockReturnValue(true);
            service['replacePlayerOnNeighborTile'] = jest.fn();

            service['replacePlayerOnSpawnPoint'](playerToReplace, mockClient, mockServer);
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('respawnPlayer', { oldPosition, playerToReplace });
            expect(playerToReplace.position).toEqual(playerToReplace.spawnPosition);
            expect(service['replacePlayerOnNeighborTile']).not.toHaveBeenCalled();
        });

        it('should put player on closed spawn if spawn not available', () => {
            const playerToReplace = mockPlayers[0];
            const oldPosition = playerToReplace.position;
            service['checkSpawnPointAvailability'] = jest.fn().mockReturnValue(false);
            service['replacePlayerOnNeighborTile'] = jest.fn();

            service['replacePlayerOnSpawnPoint'](playerToReplace, mockClient, mockServer);

            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('respawnPlayer', { oldPosition, playerToReplace });
            expect(service['replacePlayerOnNeighborTile']).toHaveBeenCalled();
        });
    });

    describe('checkSpawnPointAvailability', () => {
        it('should return true if no other player on its spawn point', () => {
            const otherPlayer = { position: { x: 3, y: 2 } } as unknown as Player;
            const result = service['checkSpawnPointAvailability'](mockPlayers[0], [otherPlayer]);
            expect(result).toBe(true);
        });

        it('should return false if other player on its spawn point', () => {
            const result = service['checkSpawnPointAvailability'](mockPlayers[0], [mockPlayers[1]]);
            expect(result).toBe(false);
        });
    });

    describe('replacePlayerOnNeighborTile', () => {
        it('should place the player on the first available neighbor tile', () => {
            const neighbor = [{ x: 0, y: 0 }];
            service['getNeighbors'] = jest.fn().mockReturnValue(neighbor);
            const result = service['replacePlayerOnNeighborTile'](mockPlayers[0], room.gameMap);
            expect(result).toEqual({ x: 0, y: 0 });
        });

        it('should handle recursion when all neighbors are occupied initially', () => {
            const player = mockPlayers[0];
            service['getNeighbors'] = jest
                .fn()
                .mockReturnValueOnce([{ x: 0, y: 1 }])
                .mockReturnValue([{ x: 0, y: 0 }]);

            const result = service['replacePlayerOnNeighborTile'](player, room.gameMap);

            expect(result).toEqual({ x: 0, y: 0 });
            expect(player.position).toEqual({ x: 0, y: 0 });
        });
    });

    it('should return valid neighbors within game boundaries', () => {
        const position = { x: 1, y: 1 };
        service['isValidTile'] = jest.fn().mockReturnValue(true);

        const neighbors = service['getNeighbors'](position, mockGame);

        expect(neighbors).toEqual([
            { x: 1, y: 2 },
            { x: 1, y: 0 },
            { x: 2, y: 1 },
            { x: 0, y: 1 },
        ]);
    });

    it('should return true if valid tile', () => {
        const result = service['isValidTile'](1, 1, 3);
        expect(result).toBe(true);
    });

    it('should add victory on default win', () => {
        service['addVictory'] = jest.fn();
        service['defaultCombatWin'](room, mockPlayers[0], mockServer);
        expect(mockServer.to(mockPlayers[0].id).emit).toHaveBeenCalledWith('defaultWin');
    });

    describe('getOpponent', () => {
        it('should return undefined if client.data.roomCode is undefined', () => {
            mockClient.data.roomCode = undefined;
            const result = service['getOpponent'](mockClient);
            expect(result).toBeUndefined();
        });

        it('should return undefined if client.data is undefined', () => {
            mockClient.data = undefined;
            const result = service['getOpponent'](mockClient);
            expect(result).toBeUndefined();
        });

        it('should return attacker if player is defender', () => {
            mockClient.data.roomCode = room.roomId;
            const players = service.combatInfos.get(room.roomId).combatPlayers;
            players.attacker.id = mockClient.id;
            players.defender.id = 'defender123';

            const result = service['getOpponent'](mockClient);
            expect(result).toEqual(players.defender);
        });

        it('should return defender if player is attacker', () => {
            mockClient.data.roomCode = room.roomId;
            const players = service.combatInfos.get(room.roomId).combatPlayers;
            players.defender.id = mockClient.id;
            players.attacker.id = 'attacker123';

            const result = service['getOpponent'](mockClient);
            expect(result).toEqual(players.attacker);
        });
    });

    it('should decrease attack and defense if player on ice', () => {
        const iceTiles = [[TileType.Ice, TileType.Ice]];
        const playerOnIce = mockPlayers[0];
        service['handlePlayerOnIce'](playerOnIce, iceTiles, room.listPlayers);
        expect(playerOnIce.attributes.attack).toBe(ICE_TILE_PENALTY_VALUE);
        expect(playerOnIce.attributes.defense).toBe(ICE_TILE_PENALTY_VALUE);
    });
});
