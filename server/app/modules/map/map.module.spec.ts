import { MapController } from '@app/controllers/map/map.controller';
import { MapService } from '@app/services/map/map.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MapModule } from './map.module';

describe('MapModule', () => {
    let module: TestingModule;
    let service: MapService;
    let controller: MapController;
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();

        module = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: async () => ({
                        uri: mongoServer.getUri(),
                    }),
                }),
                MapModule,
            ],
        }).compile();

        service = module.get<MapService>(MapService);
        controller = module.get<MapController>(MapController);
    });

    afterAll(async () => {
        await module.close();
        await mongoServer.stop();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
        expect(service).toBeDefined();
        expect(controller).toBeDefined();
    });

    it('should inject MapService into MapController', () => {
        const injectedService = controller['mapService'];
        expect(injectedService).toBe(service);
    });
});
