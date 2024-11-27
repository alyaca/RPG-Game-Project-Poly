import { Test, TestingModule } from '@nestjs/testing';
import { GameLogsService } from '../game-logs/game-logs.service';
import { RoomService } from '../room/room.service';
import { PlayerInventoryService } from './player-inventory.service';

describe('PlayerInventoryService', () => {
    let service: PlayerInventoryService;
    let roomService: RoomService;
    let gameLogService: GameLogsService;

    beforeEach(async () => {
        const roomServiceMock = {
            getRoom: jest.fn(),
            getTurnTimer: jest.fn(),
        };

        const gameLogServiceMock = {
            sendItemLog: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PlayerInventoryService,
                { provide: RoomService, useValue: roomServiceMock },
                { provide: GameLogsService, useValue: gameLogServiceMock },
            ],
        }).compile();

        service = module.get<PlayerInventoryService>(PlayerInventoryService);
        roomService = module.get<RoomService>(RoomService);
        gameLogService = module.get<GameLogsService>(GameLogsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
