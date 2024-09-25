import { Map } from '@app/model/schema/map.schema';
import { MapService } from '@app/services/map/map.service';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
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

    it('allMaps should return all maps', async () => {
        const fakeMaps: Map[] = [new Map(), new Map()];
        mapService.getAllMaps.resolves(fakeMaps);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (maps) => {
            expect(maps).toEqual(fakeMaps);
            return res;
        };

        await controller.allMaps(res);
    });

    it('allMaps should return NOT_FOUND when service unable to fetch maps', async () => {
        mapService.getAllMaps.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.allMaps(res);
    });

    it('allVisibleMaps should return only visible maps', async () => {
        const fakeMaps: Map[] = [{ visible: true } as Map, { visible: true } as Map];

        mapService.getVisibleMaps.resolves(fakeMaps);

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.OK);
            return res;
        };
        res.json = (maps) => {
            expect(maps).toEqual(fakeMaps);
            return res;
        };

        await controller.visibleMaps(res);
    });

    it('visibleMaps should return NOT_FOUND when service unable to fetch visible maps', async () => {
        mapService.getVisibleMaps.rejects();

        const res = {} as unknown as Response;
        res.status = (code) => {
            expect(code).toEqual(HttpStatus.NOT_FOUND);
            return res;
        };
        res.send = () => res;

        await controller.visibleMaps(res);
    });
});
