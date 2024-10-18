import { Message, MessageSchema } from '@app/model/schema/message.schema';
import { getConnectionToken, getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, Model } from 'mongoose';
import { ChatService } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;
  let mongoServer: MongoMemoryServer;
  let messageModel: Model<Message>;
  let connection: Connection;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRootAsync({
          useFactory: async () => ({
            uri: mongoServer.getUri(), 
          }),
        }),
        MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]), // Include schema for Message model
      ],
      providers: [ChatService],
    }).compile();

    service = module.get<ChatService>(ChatService);
    messageModel = module.get<Model<Message>>(getModelToken(Message.name));
    connection = await module.get(getConnectionToken());
  });

  afterAll(async () => {
    await mongoServer.stop(); 
    await connection.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
