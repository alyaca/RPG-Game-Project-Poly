import { Map, MapDocument } from '@app/model/schema/map.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SavingService {
    constructor(@InjectModel(Map.name) private mapModel: Model<MapDocument>) {}

    async addMapToDb(mapToAdd: any) {
        return (await this.mapModel.create(mapToAdd)).save();
    }

    async replaceMapInDb(mapToAdd: any) {
        return (await this.mapModel.findOneAndReplace({ _id: mapToAdd._id }, mapToAdd)).save();
    }
}
