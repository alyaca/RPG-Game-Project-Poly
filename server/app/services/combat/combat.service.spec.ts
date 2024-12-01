import { Timer } from '@app/classes/timer/timer';
import { END_COMBAT_DELAY, ICE_TILE_PENALTY_VALUE, MIN_DICE_VALUE, ROLL_DURATION, TURN_TIME } from '@app/constants';
import { mockAttacker, mockCombatInfos, mockCombatPlayers, mockDefender } from '@app/mocks/mock-combat-infos';
import { mockGame } from '@app/mocks/mock-game';
import { mockPlayers } from '@app/mocks/mock-players';
import { mockRooms } from '@app/mocks/mock-room';
import { CombatService } from '@app/services/combat/combat.service';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { GameService } from '@app/services/game/game.service';
import { RoomService } from '@app/services/room/room.service';
import { GameMode, TileType } from '@common/constants';
import { CombatInfos, CombatPlayers } from '@common/interfaces/combat-info';
import { Player } from '@common/interfaces/player';
import { PlayerStatType } from '@common/interfaces/post-game-stat';
import { Room } from '@common/interfaces/room';
import { ActionData } from '@common/interfaces/socket-data.interface';
import { ServerToClientEvent } from '@common/socket.events';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';

/* eslint-disable max-lines */
describe('CombatService', () => {
    let service: CombatService;
    let mockRoomService: jest.Mocked<RoomService>;
    let mockGameService: jest.Mocked<GameService>;
    let mockLogsService: jest.Mocked<GameLogsService>;
    let mockServer: Server;
    let mockClient: Socket;
    let room: Room;
    let combatPlayers: CombatPlayers;
    let combatInfos: CombatInfos;
    let attacker: Player;
    let defender: Player;

    beforeEach(async () => {
        mockRoomService = {
            getRoom: jest.fn(),
            getTurnTimer: jest.fn().mockReturnValue({
                getTimeRemaining: jest.fn().mockReturnValue(TURN_TIME),
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
            placeItemsOnGround: jest.fn(),
            resetGlobalStats: jest.fn(),
            onEndGame: jest.fn(),
        } as unknown as jest.Mocked<GameService>;

        mockLogsService = {
            createLog: jest.fn(),
            getGameLog: jest.fn(),
            sendPlayerLog: jest.fn(),
            sendEndGameLog: jest.fn(),
            sendGlobalCombatLog: jest.fn(),
            sendCombatActionLog: jest.fn(),
            sendCombatResultLog: jest.fn(),
        } as unknown as jest.Mocked<GameLogsService>;

        mockServer = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn(),
            sockets: {
                sockets: new Map(),
                adapter: {
                    rooms: new Map(),
                },
            },
        } as unknown as jest.Mocked<Server>;

        mockClient = { id: 'admin', data: { roomCode: '1234' }, to: jest.fn().mockReturnThis(), emit: jest.fn() } as unknown as Socket;
        room = JSON.parse(JSON.stringify(mockRooms[0]));
        combatPlayers = JSON.parse(JSON.stringify(mockCombatPlayers));
        combatInfos = JSON.parse(JSON.stringify(mockCombatInfos));
        attacker = JSON.parse(JSON.stringify(mockAttacker));
        defender = JSON.parse(JSON.stringify(mockDefender));

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CombatService,
                { provide: RoomService, useValue: mockRoomService },
                { provide: GameService, useValue: mockGameService },
                { provide: GameLogsService, useValue: mockLogsService },
            ],
        }).compile();

        service = module.get<CombatService>(CombatService);
        service.combatInfos.set(room.roomId, combatInfos);
        room.listPlayers = [mockPlayers[0]];
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
            service.emitToCombatPlayers(mockServer, combatPlayers, event, data);

            expect(mockServer.to).toHaveBeenCalledWith(combatPlayers.attacker.id);
            expect(mockServer.to).toHaveBeenCalledWith(combatPlayers.defender.id);
            expect(mockServer.to(combatPlayers.attacker.id).emit).toHaveBeenCalledWith(event, data);
            expect(mockServer.to(combatPlayers.defender.id).emit).toHaveBeenCalledWith(event, data);
        });
    });

    describe('initializeCombatInfos', () => {
        it('should initialize players and emit startFight event', () => {
            const combatActionData: ActionData = { clickedPosition: { x: 0, y: 1 }, player: attacker };
            room.navigation.getCombatOpponent = jest.fn().mockReturnValue(defender);
            service['handlePlayerOnIce'] = jest.fn();

            service['initializeCombatInfos'](combatActionData, room);

            expect(service['handlePlayerOnIce']).toHaveBeenCalled();
        });
    });

    describe('startFight', () => {
        it('should initialize players and emit startFight event', () => {
            const combatActionData: ActionData = { clickedPosition: { x: 0, y: 1 }, player: attacker };
            service['initializeCombatInfos'] = jest.fn().mockReturnValue(combatPlayers);
            mockLogsService.sendGlobalCombatLog = jest.fn();
            service['isAttacker'] = jest.fn().mockReturnValue(true);
            service.emitToCombatPlayers = jest.fn();
            service.onStartTurn = jest.fn();

            service.startFight(room, mockServer, combatActionData);

            expect(mockLogsService.sendGlobalCombatLog).toHaveBeenCalled();
            expect(service.emitToCombatPlayers).toHaveBeenCalled();
            expect(service.onStartTurn).toHaveBeenCalledWith(mockServer, room);
        });
    });

    it('should reset timer and emit to players setFightTimer', () => {
        service['isBothPlayersBot'] = jest.fn().mockReturnValue(false);
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

        service.setFightTimer(room, mockServer, combatPlayers);
        fightTimerCallback(remainingTime);
        expect(service.emitToCombatPlayers).toHaveBeenCalled();
        fightTimerCallback(0);
    });

    it('should reset timer to 3 seconds and emit to players setFightTimer', () => {
        service['isBothPlayersBot'] = jest.fn().mockReturnValue(false);
        const player = service.combatInfos.get(room.roomId).combatPlayers.attacker;
        player.attributes.evasion = 0;
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

        service.setFightTimer(room, mockServer, combatPlayers);
        fightTimerCallback(remainingTime);
        expect(service.emitToCombatPlayers).toHaveBeenCalled();
        fightTimerCallback(0);
    });

    it('should switch attacker onEndTurn', () => {
        service.emitToCombatPlayers = jest.fn();
        service.onStartTurn = jest.fn();

        service.onEndTurn(mockServer, room);

        expect(service.combatInfos.get(room.roomId)).toBe(combatInfos);
        expect(service.emitToCombatPlayers).toHaveBeenCalled();
        expect(service.onStartTurn).toHaveBeenCalledWith(mockServer, room);
    });

    describe('attackPlayer', () => {
        it('should decrease defensePlayer HP when attack is successful', () => {
            const combatValue = { attackValues: { total: 10, diceValue: 4 }, defenseValues: { total: 4, diceValue: 1 } };
            service.getCombatValues = jest.fn().mockReturnValue(combatValue);
            service.emitToCombatPlayers = jest.fn();
            service['checkCombatOutcome'] = jest.fn();
            service['addToPostGameStats'] = jest.fn();
            mockLogsService.sendCombatActionLog = jest.fn();
            mockLogsService.sendCombatResultLog = jest.fn();

            service.attackPlayer(room, mockServer);
            expect(service['checkCombatOutcome']).toHaveBeenCalled();
            expect(mockLogsService.sendCombatActionLog).toHaveBeenCalled();
        });
    });

    it('should decrease activePlayer HP when defense is successful', () => {
        const combatValue = { attackValues: 3, defenseValues: 10 };
        service.getCombatValues = jest.fn().mockReturnValue(combatValue);
        service.emitToCombatPlayers = jest.fn();
        service['checkCombatOutcome'] = jest.fn();
        service.onEndTurn = jest.fn();
        service['addToPostGameStats'] = jest.fn();

        service.attackPlayer(room, mockServer);
        expect(service.emitToCombatPlayers).toHaveBeenCalledWith(mockServer, combatPlayers, 'attackValues', combatValue);
        expect(service.emitToCombatPlayers).toHaveBeenCalled();
    });

    describe('getCombatValues', () => {
        it('should set attack to max dice value and defense to min dice value on debug mode', () => {
            const players = service.combatInfos.get(room.roomId).combatPlayers;
            const attackDice = players.attacker.attributes.atkDiceMax;
            const expectedAttackValues = { total: players.attacker.attributes.attack + attackDice, diceValue: attackDice };
            const expectedDefenseValues = { total: players.defender.attributes.defense + MIN_DICE_VALUE, diceValue: MIN_DICE_VALUE };
            const expectedResult = { attackValues: expectedAttackValues, defenseValues: expectedDefenseValues };

            const result = service.getCombatValues(players, true);
            expect(result).toEqual(expectedResult);
            expect(players.combatResultDetails).toEqual(expectedResult);
        });

        it('should calculate dice value and set result in combatPlayers not in debug mode', () => {
            const attackDice = 2;
            const defenseDice = 5;
            const players = service.combatInfos.get(room.roomId).combatPlayers;
            const expectedAttackValues = { total: players.attacker.attributes.attack + attackDice, diceValue: attackDice };
            const expectedDefenseValues = { total: players.defender.attributes.defense + defenseDice, diceValue: defenseDice };
            const expectedResult = { attackValues: expectedAttackValues, defenseValues: expectedDefenseValues };
            service['getRandomValue'] = jest.fn().mockReturnValueOnce(attackDice).mockReturnValue(defenseDice);

            const result = service.getCombatValues(players, false);
            expect(result).toEqual(expectedResult);
            expect(players.combatResultDetails).toEqual(expectedResult);
        });
    });

    describe('managePlayerDeath', () => {
        it('should manage player death', () => {
            service['replacePlayerOnSpawnPoint'] = jest.fn();
            service['manageTurnAfterCombat'] = jest.fn();
            service['handleCombatWon'] = jest.fn();
            service['resetPlayerIcePenalty'] = jest.fn();
            service['emitToCombatPlayers'] = jest.fn();

            service['managePlayerDeath'](room, attacker, defender, mockServer);

            expect(service['replacePlayerOnSpawnPoint']).toHaveBeenCalledWith(defender, mockServer, room);
            expect(service['manageTurnAfterCombat']).toHaveBeenCalledWith(attacker, mockServer, room);
            expect(service['handleCombatWon']).toHaveBeenCalledWith(attacker, mockServer, room);
            expect(service['resetPlayerIcePenalty']).toHaveBeenCalled();
            expect(service['emitToCombatPlayers']).toHaveBeenCalled();
        });
    });

    describe('checkCombatOutcome', () => {
        it('should return manage defender death if player dies', () => {
            combatPlayers.defender.attributes.currentHp = 0;
            service['managePlayerDeath'] = jest.fn();

            service['checkCombatOutcome'](room, combatPlayers, mockServer);
            expect(service['managePlayerDeath']).toHaveBeenCalledWith(room, combatPlayers.attacker, combatPlayers.defender, mockServer);
        });

        it('should return manage attacker death if player die', () => {
            combatPlayers.attacker.attributes.currentHp = 0;
            service['managePlayerDeath'] = jest.fn();

            service['checkCombatOutcome'](room, combatPlayers, mockServer);
            expect(service['managePlayerDeath']).toHaveBeenCalledWith(room, combatPlayers.defender, combatPlayers.attacker, mockServer);
        });

        it('should end turn', () => {
            jest.useFakeTimers();
            service['onEndTurn'] = jest.fn();

            service['checkCombatOutcome'](room, combatPlayers, mockServer);
            jest.advanceTimersByTime(ROLL_DURATION);
            expect(service.onEndTurn).toHaveBeenCalledWith(mockServer, room);
        });
    });

    describe('manageTurnAfterCombat', () => {
        it('should continue turn if active player wins combat', () => {
            service['continueTurn'] = jest.fn();
            mockGameService.getActivePlayer = jest.fn().mockReturnValue(mockPlayers[0]);
            room.navigation.findReachableTiles = jest.fn().mockReturnValue([]);

            service.manageTurnAfterCombat(mockPlayers[0], mockServer, room);

            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('reachableTiles', []);
            expect(service['continueTurn']).toHaveBeenCalled();
        });

        it('should end turn if active player loses combat', () => {
            jest.useFakeTimers();
            mockGameService.getActivePlayer = jest.fn().mockReturnValue(mockPlayers[0]);
            room.navigation.findReachableTiles = jest.fn().mockReturnValue([]);
            mockGameService.onTurnEnded = jest.fn();

            service.manageTurnAfterCombat(defender, mockServer, room);
            jest.advanceTimersByTime(END_COMBAT_DELAY);

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

    // describe('isEvasionSuccessful', () => {
    //     it('should return true when Math.random() is less than EVASION_SUCCESS_RATE', () => {
    //         const successRate = EVASION_SUCCESS_RATE - 1;
    //         jest.spyOn(Math, 'random').mockReturnValue(successRate);

    //         const result = service['isEvasionSuccessful']();
    //         expect(result).toBe(true);
    //     });

    //     it('should return false when Math.random() is equal to or greater than EVASION_SUCCESS_RATE', () => {
    //         const successRate = EVASION_SUCCESS_RATE + 1;
    //         jest.spyOn(Math, 'random').mockReturnValue(successRate);

    //         const result = service['isEvasionSuccessful']();
    //         expect(result).toBe(false);
    //     });
    // });

    describe('checkEndGame', () => {
        it('should not emit endGame if no player has reached the victory threshold', () => {
            const player1 = { id: '1', postGameStats: { victories: 2 } } as Player;
            service['checkEndGame'](player1, room, mockServer);

            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('combatEnd', { listPlayers: room.listPlayers, player: player1 });
            expect(mockLogsService.sendEndGameLog).not.toHaveBeenCalled();
        });

        it('should emit endGame if player has reached the victory threshold', () => {
            room.gameMap.mode = GameMode.Classic;
            const winner = { id: '1', postGameStats: { victories: 3 } } as Player;
            service['checkEndGame'](winner, room, mockServer);
            expect(mockGameService.onEndGame).toHaveBeenCalled();
            expect(mockLogsService.sendEndGameLog).toHaveBeenCalled();
        });
        it('should not emit endGame if player has reached the victory threshold and is in CTF mode', () => {
            const winner = { id: '1', postGameStats: { victories: 3 } } as Player;
            service['checkEndGame'](winner, room, mockServer);

            expect(mockGameService.onEndGame).not.toHaveBeenCalled();
            expect(mockLogsService.sendEndGameLog).not.toHaveBeenCalled();
        });
    });

    it('should evade when evasion sucessfull', () => {
        service.emitToCombatPlayers = jest.fn();
        service.continueTurn = jest.fn();
        service['addToPostGameStats'] = jest.fn();

        service.handleEvasionSuccess(room, mockServer);

        expect(service.emitToCombatPlayers).toHaveBeenCalled();
        expect(service.continueTurn).toHaveBeenCalledWith(mockServer, room);
        expect(mockLogsService.sendCombatActionLog).toHaveBeenCalled();
        expect(mockLogsService.sendGlobalCombatLog).toHaveBeenCalled();
    });

    describe('evadingPlayer', () => {
        it('should continue turn if evasion is successful', () => {
            service['isEvasionSuccessful'] = jest.fn().mockReturnValue(true);
            service.handleEvasionSuccess = jest.fn();
            service.evadingPlayer(room, mockServer);
            expect(service.handleEvasionSuccess).toHaveBeenCalledWith(room, mockServer);
        });

        it('should end turn if evasion is not successful', () => {
            service.emitToCombatPlayers = jest.fn();
            service.onEndTurn = jest.fn();
            service['isEvasionSuccessful'] = jest.fn().mockReturnValue(false);

            service.evadingPlayer(room, mockServer);

            expect(mockLogsService.sendCombatActionLog).toHaveBeenCalled();
            expect(service.emitToCombatPlayers).toHaveBeenCalled();
            expect(service.onEndTurn).toHaveBeenCalledWith(mockServer, room);
        });
    });

    it('should addVictory combat finish', () => {
        mockClient.data.roomCode = room.roomId;
        service['isAttacker'] = jest.fn().mockReturnValue(true);
        service['resetCombatState'] = jest.fn();
        service['addVictory'] = jest.fn();
        mockLogsService.sendPlayerLog = jest.fn();

        service.handleCombatWon(attacker, mockServer, room);
        expect(service['resetCombatState']).toHaveBeenCalled();
    });

    it('should stop the fight timer and reset each player hp', () => {
        const player1 = { id: '1', attributes: { currentHp: 0 } } as Player;
        const player2 = { id: '2', attributes: { currentHp: 3 } } as Player;
        room.listPlayers.push(player1);
        room.listPlayers.push(player2);
        service['removeXiphosEffect'] = jest.fn();
        service['resetPlayerHealth'] = jest.fn();

        service['resetCombatState'](room);
        expect(mockRoomService.getFightTimer).toHaveBeenCalledWith(room.roomId);
        expect(mockRoomService.getFightTimer(room.roomId).stopTimer).toHaveBeenCalled();
        expect(service['removeXiphosEffect']).toHaveBeenCalled();
        expect(service['resetPlayerHealth']).toHaveBeenCalled();
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

        service.continueTurn(mockServer, room);
        jest.advanceTimersByTime(END_COMBAT_DELAY);

        expect(mockGameService.onTurnEnded).toHaveBeenCalledWith(room, mockServer);
    });

    it('should reset combat state when a player disconnects while in combat', () => {
        const player = { id: mockClient.id, isActive: true } as unknown as Player;
        room.listPlayers.push(player);
        mockServer.sockets.sockets.set(mockClient.id, mockClient);
        const sockets = new Set([mockClient.id, 'socket2', 'socket3']);
        mockServer.sockets.adapter.rooms.set(room.roomId, sockets);

        service['getOpponent'] = jest.fn().mockReturnValue(player);
        mockLogsService.sendPlayerLog = jest.fn();
        service['handleDefaultCombatWin'] = jest.fn();
        service.continueTurn = jest.fn();

        service.disconnectedPlayer(mockClient, mockServer);
        expect(service.continueTurn).toHaveBeenCalled();
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
            players.defender = defender;
            players.attacker = undefined;
            const result = service.isInCombat(mockClient);
            expect(result).toBe(false);
        });

        it('should return false if defender undefined', () => {
            players.attacker = attacker;
            players.defender = undefined;
            const result = service.isInCombat(mockClient);
            expect(result).toBe(false);
        });

        it('should return true if player is the attacker in combat', () => {
            players.attacker = attacker;
            players.defender = defender;
            players.attacker.id = mockClient.id;
            const result = service.isInCombat(mockClient);
            expect(result).toBe(true);
        });

        it('should return true if player is the defender in combat', () => {
            players.attacker = attacker;
            players.defender = defender;
            players.defender.id = mockClient.id;
            const result = service.isInCombat(mockClient);
            expect(result).toBe(true);
        });
    });

    it('should add victory', () => {
        service['checkEndGame'] = jest.fn();
        service['addToPostGameStats'] = jest.fn().mockReturnValueOnce(attacker);
        service['addVictory'](combatPlayers, room, mockServer, true);
        expect(service['checkEndGame']).toHaveBeenCalled();
    });

    describe('replacePlayerOnSpawnPoint', () => {
        it('should return early if player not in room', () => {
            service['replacePlayerOnSpawnPoint'](mockPlayers[2], mockServer, room);
        });

        it('should put player on its spawn if available', () => {
            const playerToReplace = mockPlayers[0];
            const oldPosition = playerToReplace.position;
            service['checkSpawnPointAvailability'] = jest.fn().mockReturnValue(true);
            service['replacePlayerOnNeighborTile'] = jest.fn();

            service['replacePlayerOnSpawnPoint'](playerToReplace, mockServer, room);
            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('respawnPlayer', { oldPosition, playerToReplace });
            expect(playerToReplace.position).toEqual(playerToReplace.spawnPosition);
            expect(service['replacePlayerOnNeighborTile']).not.toHaveBeenCalled();
        });

        it('should put player on closed spawn if spawn not available', () => {
            const playerToReplace = mockPlayers[0];
            const oldPosition = playerToReplace.position;
            service['checkSpawnPointAvailability'] = jest.fn().mockReturnValue(false);
            service['replacePlayerOnNeighborTile'] = jest.fn();

            service['replacePlayerOnSpawnPoint'](playerToReplace, mockServer, room);

            expect(mockServer.to(room.roomId).emit).toHaveBeenCalledWith('respawnPlayer', { oldPosition, playerToReplace });
            expect(service['replacePlayerOnNeighborTile']).toHaveBeenCalled();
        });
    });

    describe('checkSpawnPointAvailability', () => {
        it('should return true if player already on its spawn point', () => {
            const result = service['checkSpawnPointAvailability'](mockPlayers[0], [mockPlayers[0]]);
            expect(result).toBe(true);
        });

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
        const result = service['isValidTile'](1, 1, mockGame.dimension);
        expect(result).toBe(true);
    });

    it('should handle combat won on default win', () => {
        service['handleCombatWon'] = jest.fn();
        service['handleDefaultCombatWin'](mockClient, mockPlayers[0], mockServer);
        expect(mockServer.to(mockPlayers[0].id).emit).toHaveBeenCalledWith(ServerToClientEvent.DefaultCombatWin);
        expect(service['handleCombatWon']).toHaveBeenLastCalledWith(mockPlayers[0], mockServer, room);
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

    it('should increment postGameStats for attacker and defender and return the attacker', () => {
        room.listPlayers = mockPlayers;

        const players: CombatPlayers = {
            attacker: mockPlayers[0],
            defender: mockPlayers[1],
        };

        const attr1 = PlayerStatType.Victories;
        const attr2 = PlayerStatType.Defeats;
        const result = service['addToPostGameStats'](room, players, attr1, attr2);

        expect(result).toEqual(mockPlayers[0]);
        expect(mockPlayers[0].postGameStats.victories).toBe(1);
        expect(mockPlayers[1].postGameStats.defeats).toBe(1);
    });

    it('should return null if either attacker or defender is not found', () => {
        room.listPlayers = mockPlayers;

        const players: CombatPlayers = {
            attacker: { id: mockPlayers[0].id } as Player,
            defender: { id: 'nonexistent-defender' } as Player,
        };

        const attr1 = PlayerStatType.Victories;
        const attr2 = PlayerStatType.Defeats;

        const result = service['addToPostGameStats'](room, players, attr1, attr2);

        expect(result).toBeNull();
    });
});
