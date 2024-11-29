import { mockRoom } from '@app/mocks/mock-room';
import { GameLogsService } from '@app/services/game-logs/game-logs.service';
import { RoomService } from '@app/services/room/room.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PlayerInventoryService } from './player-inventory.service';

describe('PlayerInventoryService', () => {
    let service: PlayerInventoryService;
    // let roomService: RoomService;
    // let gameLogService: GameLogsService;

    beforeEach(async () => {
        const roomServiceMock = {
            getRoom: jest.fn().mockReturnValue(mockRoom),
            getTurnTimer: jest.fn().mockReturnValue({ pauseTimer: jest.fn() }),
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
        // roomService = module.get<RoomService>(RoomService);
        // gameLogService = module.get<GameLogsService>(GameLogsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
