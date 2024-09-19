import { Map } from '@app/model/schema/map.schema';
import { MapService } from '@app/services/map/map.service';
import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { Response } from 'express';

@Controller('maps')
export class MapController {
    constructor(private readonly mapService: MapService) {}

    @ApiOkResponse({
        description: 'Returns all maps',
        type: Map,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when no maps are found',
    })
    @Get('/')
    async allMaps(@Res() response: Response) {
        try {
            const maps = await this.mapService.getAllMaps();
            response.status(HttpStatus.OK).json(maps);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Returns all visible maps',
        type: Map,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when no visible maps are found',
    })
    @Get('/visible')
    async allVisibleMaps(@Res() response: Response) {
        try {
            const allVisibleMaps = await this.mapService.getAllVisibleMaps();
            response.status(HttpStatus.OK).json(allVisibleMaps);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }
}
