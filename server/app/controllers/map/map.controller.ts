import { Map } from '@app/model/schema/map.schema';
import { MapService } from '@app/services/map/map.service';
import { SavingService } from '@app/services/saving/saving.service';
import { Body, Controller, Get, HttpStatus, Post, Put, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse } from '@nestjs/swagger';
import { Response } from 'express';

@Controller('maps')
export class MapController {
    constructor(
        private readonly mapService: MapService,
        private savingService: SavingService,
    ) {}

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

    @ApiCreatedResponse({
        description: 'Map successfully created',
        type: Map,
    })
    @ApiBadRequestResponse({
        description: 'Map was not created',
    })
    @Post('/')
    async addMap(@Res() response: Response) {
        try {
            const hasBeenCreated = await this.savingService.addMapToDb(Body); //idk yet
            response.status(HttpStatus.CREATED).json(hasBeenCreated);
        } catch (error) {
            response.status(HttpStatus.BAD_REQUEST).send(error.message);
        }
    }

    @ApiCreatedResponse({
        description: 'Map succesfully replaced in the databse',
        type: Map,
    })
    @ApiBadRequestResponse({
        description: 'Map was not replaced correctly',
    })
    @Put('/')
    async replaceMap(@Res() response: Response) {
        try {
            const hasBeenCreated = await this.savingService.replaceMapInDb(Body);
            response.status(HttpStatus.CREATED).json(hasBeenCreated);
        } catch (error) {
            response.status(HttpStatus.BAD_REQUEST).send(error.message);
        }
    }
}
