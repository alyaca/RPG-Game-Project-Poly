import { Map, MapDocument } from '@app/model/schema/map.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SavingService {
    constructor(@InjectModel(Map.name) private mapModel: Model<MapDocument>) {}

    async addMapToDb(mapToAdd: Partial<Map>): Promise<Map | null> {
        const existsAlready = await this.mapModel.find({ name: mapToAdd.name });
        if (existsAlready.length === 0) {
            return (await this.mapModel.create(mapToAdd)).save();
        }
        return null;
    }
    async replaceMapInDb(mapToAdd: Partial<Map>): Promise<Map | null> {
        const nameExistsAlready = await this.mapModel.find({ name: mapToAdd.name });
        if (nameExistsAlready.length === 0) {
            return await this.mapModel.findOneAndReplace({ _id: mapToAdd._id }, mapToAdd);
        }
        return null;
    }
}
