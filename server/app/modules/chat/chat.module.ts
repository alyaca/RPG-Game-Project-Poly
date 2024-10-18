import { ChatGateway } from '@app/gateways/chat/chat.gateway'; // Importation de ChatGateway
import { Message, MessageSchema } from '@app/model/schema/message.schema'; // Importation du MessageSchema
import { ChatService } from '@app/services/chat/chat.service'; // Importation de ChatService
import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Importation de MongooseModule
import { RoomModule } from '../room/room.module';

@Module({
    imports: [RoomModule, MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }])],
    providers: [ChatGateway, ChatService, Logger],
})
export class ChatModule {}
