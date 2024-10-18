import { ChatService } from '@app/services/chat/chat.service';
import { RoomService } from '@app/services/room/room.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { Server, Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let chatService: SinonStubbedInstance<ChatService>;
    let roomService: SinonStubbedInstance<RoomService>;
    let logger: SinonStubbedInstance<Logger>;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;

    beforeEach(async () => {
        chatService = createStubInstance(ChatService);
        roomService = createStubInstance(RoomService);
        logger = createStubInstance(Logger);
        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                { provide: ChatService, useValue: chatService },
                { provide: RoomService, useValue: roomService },
                { provide: Logger, useValue: logger },
            ],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        // We want to assign a value to the private field
        // eslint-disable-next-line dot-notation
        gateway['server'] = server;
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

});
