import { Map, MapDocument, mapSchema } from '@app/model/schema/map.schema';
import { Logger } from '@nestjs/common';
import { MongooseModule, getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection, Model } from 'mongoose';
import { MapService } from './map.service';

describe('MapService', () => {
    let service: MapService;
    let mapModel: Model<MapDocument>;
    let mongoServer: MongoMemoryServer;
    let connection: Connection;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: () => ({
                        uri,
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

    afterEach(async () => {
        await mapModel.deleteMany({});
    });

    afterAll(async () => {
        await connection.close();
        await mongoServer.stop({ doCleanup: true });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
        expect(mapModel).toBeDefined();
    });

    it('getAllMaps should return all maps in database', async () => {
        const maps = getFakeMaps(GENERATE_COUNT);
        await mapModel.create(maps);
        expect((await service.getAllMaps()).length).toBeGreaterThan(0);
    });

    it('getAllMaps should return empty array if there is no maps in database', async () => {
        expect(await service.getAllMaps()).toEqual([]);
    });

    it('getAllVisibleMaps should return all visible maps in database', async () => {
        const maps = getFakeMaps(GENERATE_COUNT);
        await mapModel.create(maps);
        expect((await service.getVisibleMaps()).length).toBeGreaterThan(0);
    });

    it('getAllVisibleMaps should return empty array if there is no maps in database', async () => {
        expect(await service.getVisibleMaps()).toEqual([]);
    });

    it('updateMap should update a map in database', async () => {
        const maps = getFakeMaps(GENERATE_COUNT);
        await mapModel.create(maps);
        const map = (await service.getAllMaps())[0];
        const updatedMap = await service.updateMap(map._id, { name: 'name2' });
        expect(updatedMap.name).toEqual('name2');
    });
    const id = new mongoose.Types.ObjectId().toHexString();
    it('updateMap should return null if map is not found', async () => {
        const updatedMap = await service.updateMap(id, { name: 'name2' });
        expect(updatedMap).toBeNull();
    });

    it('deleteMap should delete a map in database', async () => {
        const maps = getFakeMaps(GENERATE_COUNT);
        await mapModel.create(maps);
        const map = (await service.getAllMaps())[0];
        const result = await service.deleteMap(map._id);
        expect(result).toBeTruthy();
    });
});

const MODES = ['CTF', 'Normal'];
const GENERATE_COUNT = 5;
const BASE_36 = 36;
const TILE_COUNT = 6;
const DIMENSION = 20;
const NB_PLAYERS = 6;
const COLUMN_LENGTH = 2;
const ROW_LENGTH = 2;

const getRandomString = (): string => (Math.random() + 1).toString(BASE_36).substring(2);

const getRandom2DArray = (rows: number, cols: number, maxValue: number): number[][] =>
    Array.from({ length: rows }, () => Array.from({ length: cols }, () => Math.floor(Math.random() * maxValue)));

const getFakeMaps = (count: number): Map[] => {
    const maps: Map[] = [];
    for (let i = 0; i < count; i++) {
        const array2D = getRandom2DArray(ROW_LENGTH, COLUMN_LENGTH, TILE_COUNT);
        const isVisible = i % 2 === 0;
        maps.push({
            _id: new mongoose.Types.ObjectId().toHexString(),
            name: getRandomString(),
            description: getRandomString(),
            visible: isVisible,
            mode: MODES[Math.floor(Math.random() * MODES.length)],
            nbPlayers: NB_PLAYERS,
            image: 'Kratos.img',
            tiles: array2D,
            dimension: DIMENSION,
            itemPlacement: array2D,
            isSelected: false,
            lastModification: new Date(),
        });
    }
    return maps;
};
