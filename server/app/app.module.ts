import { LoggerModule } from '@app/modules/logger/logger.module';
import { RoomModule } from '@app/modules/room/room.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SocketGateway } from './gateways/socket/socket.gateway';
import { ChatModule } from './modules/chat/chat.module';
import { MapModule } from './modules/map/map.module';
import { GameService } from './services/game/game.service';

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
        ChatModule,
        RoomModule,
        LoggerModule,
    ],
    providers: [SocketGateway, GameService],
})
export class AppModule {}
