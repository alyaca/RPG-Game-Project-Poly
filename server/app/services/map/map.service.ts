import { Map, MapDocument } from '@app/model/schema/map.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MapService {
    constructor(@InjectModel(Map.name) private mapModel: Model<MapDocument>) {}

    // fetch all maps
    async getAllMaps(): Promise<Map[]> {
        return await this.mapModel.find();
    }

    // fetch only visible maps
    async getAllVisibleMaps(): Promise<Map[]> {
        return await this.mapModel.find({ visible: true });
    }
}
