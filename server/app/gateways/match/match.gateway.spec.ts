import { Test, TestingModule } from '@nestjs/testing';
import { MatchService } from '../../services/match/match.service';
import { MatchGateway } from './match.gateway';

describe('MatchGateway', () => {
    let gateway: MatchGateway;
    let service: MatchService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MatchGateway,
                {
                    provide: MatchService,
                    useValue: {},
                },
            ],
        }).compile();

        gateway = module.get<MatchGateway>(MatchGateway);
        service = module.get<MatchService>(MatchService);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });
});
