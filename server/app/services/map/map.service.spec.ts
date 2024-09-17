import { Logger } from '@nestjs/common';
import { MongooseModule, getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { Map, MapDocument, mapSchema } from '../../model/schema/map.schema';
import { MapService } from './map.service';

describe('MapService', () => {
    let service: MapService;
    let mapModel: Model<MapDocument>;
    let mongoServer: MongoMemoryServer;
    let connection: Connection;

    beforeAll(async () => {
        // Set up MongoMemoryServer
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        // Create a testing module with MongooseModule
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: () => ({
                        uri: mongoServer.getUri(),
                    }),
                }),
                MongooseModule.forFeature([{ name: Map.name, schema: mapSchema }]),
            ],
            providers: [MapService, Logger],
        }).compile();

        service = module.get<MapService>(MapService);
        mapModel = module.get<Model<MapDocument>>(getModelToken(Map.name));
        connection = await module.get(getConnectionToken());
    });

    // Deletes values from database after each test
    afterEach(async () => {
        await mapModel.deleteMany({});
    });

    afterAll(async () => {
        // Clean up
        await connection.close();
        await mongoServer.stop({ doCleanup: true });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(mapModel).toBeDefined();
    });

    it('getAllMaps should return all maps in database', async () => {
        const maps = getFakeMaps(5);
        await mapModel.create(maps);
        expect((await service.getAllMaps()).length).toBeGreaterThan(0);
    });

    it('getAllMaps should return empty array if there is no maps in database', async () => {
        expect(await service.getAllMaps()).toEqual([]);
    });

    it('getAllVisibleMaps should return all visible maps in database', async () => {
        const maps = getFakeMaps(5);
        await mapModel.create(maps);
        expect((await service.getAllVisibleMaps()).length).toBeGreaterThan(0);
    });

    it('getAllVisibleMaps should return empty array if there is no maps in database', async () => {
        expect(await service.getAllVisibleMaps()).toEqual([]);
    });
});

const getFakeMaps = (count: number): Map[] => {
    const maps: Map[] = [];
    for (let i = 0; i < count; i++) {
        const isVisible = i % 2 === 0;
        maps.push({
            name: getRandomString(),
            description: getRandomString(),
            visible: isVisible,
            mode: 'CTF',
            nbPlayers: 6,
            image: 'Kratos.img',
            tiles: [0, 1, 2, 3, 4, 5],
            dimension: 20,
            itemPlacement: [0, 1, 0, 10],
            lastModification: new Date(),
        });
    }
    return maps;
};

const BASE_36 = 36;
const getRandomString = (): string => (Math.random() + 1).toString(BASE_36).substring(2);
