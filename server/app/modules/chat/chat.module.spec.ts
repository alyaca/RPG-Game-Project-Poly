import { ChatGateway } from '@app/gateways/chat/chat.gateway';
import { Message, messageSchema } from '@app/model/schema/message.schema';
import { ChatService } from '@app/services/chat/chat.service';
import { RoomService } from '@app/services/room/room.service';
import { Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ChatModule } from './chat.module';

describe('ChatModule', () => {
    let module: TestingModule;
    let chatService: ChatService;
    let roomService: RoomService;
    let chatGateway: ChatGateway;
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();

        module = await Test.createTestingModule({
            imports: [
                MongooseModule.forRootAsync({
                    useFactory: async () => ({
                        uri: mongoServer.getUri(),
                    }),
                }),
                // Injection du modèle Message dans Mongoose
                MongooseModule.forFeature([{ name: Message.name, schema: messageSchema }]),
                ChatModule,
            ],
            providers: [ChatService, RoomService, ChatGateway, Logger],
        }).compile();

        chatService = module.get<ChatService>(ChatService);
        roomService = module.get<RoomService>(RoomService);
        chatGateway = module.get<ChatGateway>(ChatGateway);
    });

    afterAll(async () => {
        await module.close();
        await mongoServer.stop();
    });

    it('should be defined', () => {
        expect(module).toBeDefined();
        expect(chatService).toBeDefined();
        expect(roomService).toBeDefined();
        expect(chatGateway).toBeDefined();
    });

    it('should inject ChatService and RoomService into ChatGateway', () => {
        const injectedChatService = chatGateway['chatService'];
        const injectedRoomService = chatGateway['roomService'];
        expect(injectedChatService).toBe(chatService);
        expect(injectedRoomService).toBe(roomService);
    });
});
