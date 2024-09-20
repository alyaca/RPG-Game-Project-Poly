import { Map, MapDocument } from '@app/model/schema/map.schema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class MapService {
    constructor(@InjectModel(Map.name) private mapModel: Model<MapDocument>) {}

    async getAllMaps(): Promise<Map[]> {
        return await this.mapModel.find();
    }

    async getAllVisibleMaps(): Promise<Map[]> {
        return await this.mapModel.find({ visible: true });
    }
}
