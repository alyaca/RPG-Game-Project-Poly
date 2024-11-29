import { LoggerModule } from '@app/modules/logger/logger.module';
import { RoomModule } from '@app/modules/room/room.module';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SocketGateway } from './gateways/socket/socket.gateway';
import { ChatModule } from './modules/chat/chat.module';
import { MapModule } from './modules/map/map.module';
import { CombatService } from './services/combat/combat.service';
import { GameLogsService } from './services/game-logs/game-logs.service';
import { GameService } from './services/game/game.service';
import { MatchService } from './services/match/match.service';
import { PlayerInventoryService } from './services/player-inventory/player-inventory.service';
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
        ChatModule,
        RoomModule,
        LoggerModule,
    ],
    providers: [MatchService, RoomService, SocketGateway, Logger, GameService, GameLogsService, CombatService, PlayerInventoryService],
})
export class AppModule {}
