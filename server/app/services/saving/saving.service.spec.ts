import { MapDocument, mapSchema } from '@app/model/schema/map.schema';
import { Logger } from '@nestjs/common';
import { getConnectionToken, getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { SavingService } from './saving.service';

describe('Saving service', () => {
    let savingService: SavingService;
    let mapModel: Model<MapDocument>;
    let mongoServer: MongoMemoryServer;
    let connection: Connection;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        const testingModule: TestingModule = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({ useFactory: () => ({ uri }) }),
                MongooseModule.forFeature([{ name: Map.name, schema: mapSchema }]),
            ],
            providers: [SavingService, Logger],
        }).compile();

        savingService = testingModule.get<SavingService>(SavingService);
        mapModel = testingModule.get<Model<MapDocument>>(getModelToken(Map.name));
        connection = await testingModule.get(getConnectionToken());
    });

    afterEach(async () => {
        await mapModel.deleteMany({});
    });

    afterAll(async () => {
        await connection.close();
        await mongoServer.stop({ doCleanup: true });
    });

    it('should be defined', () => {
        expect(savingService).toBeDefined();
        expect(mapModel).toBeDefined();
    });

    it('should create a new map', async () => {
        const result = await savingService.addMapToDb(NEW_MAP_NO_ID);
        expect(result).not.toBeNull();
    });

    it('should replace an existing map', async () => {
        await mapModel.create(EXISTING_MAP);
        const result = await savingService.replaceMapInDb(MAP_TO_PUT);
        expect(result).not.toBeNull();
    });

    it('addNewMap should return null if there is already a map with the same name', async () => {
        await mapModel.create(NEW_MAP_NO_ID);
        const result = await savingService.addMapToDb(NEW_MAP_NO_ID);
        expect(result).toBeNull();
    });

    it('replaceMapInDb should return null if there is already a map with the same name', async () => {
        await mapModel.create(EXISTING_MAP);
        const result = await savingService.replaceMapInDb(EXISTING_MAP);
        expect(result).toBeNull();
    });
});

const DEFAULT_DATE = new Date();
const NEW_MAP_NO_ID = {
    name: 'map name',
    description: 'description of the map',
    visible: true,
    mode: 'normal',
    nbPlayers: 2,
    image: 'image string',
    tiles: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    dimension: 10,
    itemPlacement: [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    isSelected: false,
    lastModification: DEFAULT_DATE,
};

const EXISTING_MAP = {
    _id: '66f7162b7ec70b6faefa36fd',
    name: 'old name',
    description: 'old description',
    visible: true,
    mode: 'normal',
    nbPlayers: 4,
    image: 'old image string',
    tiles: [
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 2, 3, 4, 5],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
    ],
    dimension: 15,
    itemPlacement: [
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
    ],
    isSelected: false,
    lastModification: DEFAULT_DATE,
};

const MAP_TO_PUT = {
    _id: '66f7162b7ec70b6faefa36fd',
    name: 'new name for the map',
    description: 'a different description than the last one',
    visible: true,
    mode: 'normal',
    nbPlayers: 4,
    image: 'a new image to represent the tiles',
    tiles: [
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 2, 3, 4, 5],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
        [2, 3, 1, 3, 4, 5, 6, 1, 2, 3, 1, 2, 3, 4],
    ],
    dimension: 15,
    itemPlacement: [
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
    ],
    isSelected: false,
    lastModification: DEFAULT_DATE,
};
