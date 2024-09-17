import { MapService } from '@app/services/map/map.service';
import { Test, TestingModule } from '@nestjs/testing';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { MapController } from './map.controller';

describe('MapController', () => {
    let controller: MapController;
    let mapService: SinonStubbedInstance<MapService>;

    beforeEach(async () => {
        mapService = createStubInstance(MapService);
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MapController],
            providers: [
                {
                    provide: MapService,
                    useValue: mapService,
                },
            ],
        }).compile();

        controller = module.get<MapController>(MapController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
