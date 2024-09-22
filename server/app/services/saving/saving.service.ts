import { Map, MapDocument } from '@app/model/schema/map.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SavingService {
    constructor(@InjectModel(Map.name) private mapModel: Model<MapDocument>) {}

    async addMapToDb(mapToAdd: any) {
        console.log(mapToAdd);
        return await this.mapModel.create(mapToAdd);
    }

    async replaceMapInDb(mapToAdd: any) {
        console.log('BALLS');
        const maps = await this.mapModel.find();
        console.log(maps);
        return await this.mapModel.replaceOne(maps, mapToAdd);
    }
}
