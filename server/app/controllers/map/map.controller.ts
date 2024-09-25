import { Map } from '@app/model/schema/map.schema';
import { MapService } from '@app/services/map/map.service';
import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Res } from '@nestjs/common';
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
    async visibleMaps(@Res() response: Response) {
        try {
            const visibleMaps = await this.mapService.getVisibleMaps();
            response.status(HttpStatus.OK).json(visibleMaps);
        } catch (error) {
            response.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Patch('/:id')
    @ApiOkResponse({
        description: 'Updates a specific map',
        type: Map,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when the map is not found',
    })
    async updateMap(@Param('id') id: string, @Body() updateData: Partial<Map>, @Res() response: Response) {
        try {
            const updatedMap = await this.mapService.updateMap(id, updateData);
            if (updatedMap) {
                response.status(HttpStatus.OK).json(updatedMap);
            } else {
                response.status(HttpStatus.NOT_FOUND).send('Map not found');
            }
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }

    @Delete('/:id')
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when the map is not found',
    })
    async deleteMap(@Param('id') id: string, @Res() response: Response) {
        try {
            const deleted = await this.mapService.deleteMap(id);
            if (deleted) {
                response.status(HttpStatus.NO_CONTENT).send();
            } else {
                response.status(HttpStatus.NOT_FOUND).send('Map not found');
            }
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error.message);
        }
    }
}
