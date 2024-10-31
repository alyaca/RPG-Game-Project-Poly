import { Message, messageSchema } from '@app/model/schema/message.schema';
import { LoggerModule } from '@app/modules/logger/logger.module';
import { RoomModule } from '@app/modules/room/room.module';
import { ChatService } from '@app/services/chat/chat.service';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
    imports: [LoggerModule, RoomModule, MongooseModule.forFeature([{ name: Message.name, schema: messageSchema }])],
    providers: [ChatService],
    exports: [ChatService],
})
export class ChatModule {}
