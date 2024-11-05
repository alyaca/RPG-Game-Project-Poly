import { mockServer } from '@app/mocks/mock-server';
import { Player } from '@common/player';
import { Test, TestingModule } from '@nestjs/testing';
import { GameLogsService } from './game-logs.service';

describe('GameLogsService', () => {
    let service: GameLogsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [GameLogsService],
        }).compile();

        service = module.get<GameLogsService>(GameLogsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a log', () => {
        const players: Player[] = [{ id: '1', name: 'Player1' } as Player];
        const message = 'Test message';
        const roomId = 'room1';

        const log = service.createLog(players, message, roomId);

        expect(log).toEqual({
            message: message,
            timestamp: expect.any(Date),
            players: players,
        });
        expect(service.logs.get(roomId)).toContain(log);
    });

    it('should get game log', () => {
        const roomId = 'room1';
        const players: Player[] = [{ id: '1', name: 'Player1' } as Player];
        const message = 'Test message';

        service.createLog(players, message, roomId);
        const logs = service.getGameLog(roomId);

        expect(logs).toHaveLength(1);
        expect(logs[0].message).toBe(message);
    });

    it('should send turn log if message is different', () => {
        const player: Player = { id: '1', name: 'Player1' } as Player;
        const roomId = 'room1';
        const spyEmit = jest.spyOn(mockServer.to(roomId), 'emit');

        service.sendTurnLog(player, roomId, mockServer);

        expect(spyEmit).toHaveBeenCalledWith('logReceived', expect.any(Object));
    });

    // it('should not send turn log if message is the same', () => {
    //     const player: Player = { id: '1', name: 'Player1' } as Player;
    //     const roomId = 'room1';
    // 	const turnMessage = `Début du tour du joueur ${player.name}.`
    //     const spyEmit = jest.spyOn(mockServer.to(roomId), 'emit');
    //     service.lastLog.set(roomId, turnMessage);

    //     service.sendTurnLog(player, roomId, mockServer);

    //     expect(spyEmit).toHaveBeenCalledTimes(0);
    // });

    it('should generate turn message', () => {
        const player: Player = { id: '1', name: 'Player1' } as Player;
        const message = service.generateTurnMessage(player);

        expect(message).toBe(`Début du tour du joueur ${player.name}.`);
    });

    it('should generate give up game message', () => {
        const playerName = 'Player1';
        const message = service.generateGiveUpGame(playerName);

        expect(message).toBe(`${playerName} a abandonné la partie.`);
    });
});
