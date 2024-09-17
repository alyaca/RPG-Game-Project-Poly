import { MapController } from '@app/controllers/map/map.controller';
import { Map, mapSchema } from '@app/model/schema/map.schema';
import { MapService } from '@app/services/map/map.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [MongooseModule.forFeature([{ name: Map.name, schema: mapSchema }])],
    providers: [MapService],
    controllers: [MapController],
    exports: [MapService],
})
export class MapModule {}
