import { Map, MapDocument } from '@app/model/schema/map.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SavingService {
    constructor(@InjectModel(Map.name) private mapModel: Model<MapDocument>) {}

    async addMapToDb(mapToAdd: any) {
        console.log(mapToAdd);
        await this.mapModel.insertMany(mapToAdd);
    }

    async replaceMapInDb(mapToAdd: any) {}
}
