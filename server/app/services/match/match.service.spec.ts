import { RoomService } from '@app/services/room/room.service';
import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from './match.service';

describe('MatchService', () => {
    let service: MatchService;

    beforeEach(async () => {
        const roomServiceMock = {
            getRoom: jest.fn(),
            rooms: new Map(),
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [MatchService, { provide: RoomService, useValue: roomServiceMock }],
        }).compile();

        service = module.get<MatchService>(MatchService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
