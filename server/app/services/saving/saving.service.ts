import { Map, MapDocument } from '@app/model/schema/map.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SavingService {
    constructor(@InjectModel(Map.name) private mapModel: Model<MapDocument>) {}

    async addMapToDb(mapToAdd: any) {
        console.log(mapToAdd);
        return await this.mapModel.create(mapToAdd); // Model.create() no longer accepts a callback
    }

    async replaceMapInDb(mapToAdd: any) {
        return await this.mapModel.findOneAndReplace(mapToAdd._id, mapToAdd);
    }
}
