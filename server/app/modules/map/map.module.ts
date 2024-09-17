import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MapController } from '../../controllers/map/map.controller';
import { Map, mapSchema } from '../../model/schema/map.schema';
import { MapService } from '../../services/map/map.service';

@Module({
    imports: [MongooseModule.forFeature([{ name: Map.name, schema: mapSchema }])],
    providers: [MapService],
    controllers: [MapController],
    exports: [MapService],
})
export class MapModule {}
