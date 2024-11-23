import { Player } from '@common/player';
import { Test, TestingModule } from '@nestjs/testing';
import { GameLogsService } from './game-logs.service';

describe('GameLogsService', () => {
    let service: GameLogsService;
    let mockPlayer: Player;

    beforeEach(async () => {
        mockPlayer = { id: '1', name: 'Player1' } as Player;

        const module: TestingModule = await Test.createTestingModule({
            providers: [GameLogsService],
        }).compile();

        service = module.get<GameLogsService>(GameLogsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // it('should create a log', () => {
    //     const players: Player[] = [mockPlayer];
    //     const message = 'Test message';
    //     const roomId = 'room1';

    //     const log = service['createLog'](players, message, roomId);

    //     expect(log).toEqual({
    //         message,
    //         timestamp: expect.any(Date),
    //         players,
    //     });
    //     expect(service.logs.get(roomId)).toContain(log);
    // });

    // it('should send turn log if message is different', () => {
    //     const roomId = 'room1';
    //     const spyEmit = jest.spyOn(mockServer.to(roomId), 'emit');

    //     service.sendTurnLog(mockPlayer, roomId, mockServer);

    //     expect(spyEmit).toHaveBeenCalledWith('logReceived', expect.any(Object));
    // });

    // it('should generate turn message', () => {
    //     const message = service.generateTurnMessage(mockPlayer);

    //     expect(message).toBe(`Début du tour du joueur ${mockPlayer.name}.`);
    // });

    // it('should generate give up game message', () => {
    //     const playerName = 'Player1';
    //     const message = service.generateGiveUpGame(playerName);

    //     expect(message).toBe(`${playerName} a abandonné la partie.`);
    // });

    // it('should generate debug message if debug mode has changed', () => {
    //     const isDebugMode = true;
    //     const roomId = 'room1';
    //     const spyEmit = jest.spyOn(mockServer.to(roomId), 'emit');
    //     service.sendDebugMessage(isDebugMode, roomId, mockServer);
    //     expect(spyEmit).toHaveBeenCalledWith('logReceived', expect.any(Object));
    // });

    // it('should generate debug message if it is the beginning of debug mode ', () => {
    //     const isDebugMode = true;
    //     const message = service.generateDebugMessage(isDebugMode);
    //     expect(message).toBe('Début du mode débogage.');
    // });

    // it('should generate debug message if it is the end of debug mode ', () => {
    //     const isDebugMode = false;
    //     const message = service.generateDebugMessage(isDebugMode);
    //     expect(message).toBe('Fin du mode débogage.');
    // });
});
