import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PlayerConnectionGateway } from './gateways/player-connection/player-connection.gateway';
import { MapModule } from './modules/map/map.module';
import { RoomService } from './services/room/room.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'),
            }),
        }),
        MapModule,
    ],
    providers: [RoomService, PlayerConnectionGateway, Logger],
})
export class AppModule {}
