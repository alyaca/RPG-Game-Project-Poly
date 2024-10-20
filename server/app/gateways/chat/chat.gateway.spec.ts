import { IMessage } from '@app/interfaces/message.interface';
import { ChatService } from '@app/services/chat/chat.service';
import { RoomService } from '@app/services/room/room.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { ChatGateway } from './chat.gateway';

describe('ChatGateway', () => {
    let gateway: ChatGateway;
    let chatService: ChatService;
    let roomService: RoomService;
    let socket: jest.Mocked<Socket>;
    let server: jest.Mocked<Server>;

    let loggerMock: { log: jest.Mock; error: jest.Mock };

    beforeEach(async () => {
        const chatServiceMock = {
            saveMessage: jest.fn(),
            getMessagesByRoom: jest.fn(),
        };

        const roomServiceMock = {
            getRoomId: jest.fn(),
            getServer: jest.fn(),
        };

        socket = {
            emit: jest.fn(),
            to: jest.fn().mockReturnValue({ emit: jest.fn() }),
            data: {},
        } as unknown as jest.Mocked<Socket>;

        const broadcastOperator = {
            emit: jest.fn(),
        };

        server = {
            to: jest.fn().mockReturnValue(broadcastOperator),
        } as unknown as jest.Mocked<Server>;

        loggerMock = {
            log: jest.fn(),
            error: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ChatGateway,
                { provide: ChatService, useValue: chatServiceMock },
                { provide: RoomService, useValue: roomServiceMock },
                { provide: Logger, useValue: loggerMock },
            ],
        }).compile();

        gateway = module.get<ChatGateway>(ChatGateway);
        chatService = module.get<ChatService>(ChatService);
        roomService = module.get<RoomService>(RoomService);

        gateway['server'] = server;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should handle sending and saving a message successfully', async () => {
        socket.data.username = 'Luffy';
        socket.data.roomCode = 'room123';

        const mockMessageData: IMessage = {
            roomId: 'room123',
            username: socket.data.username,
            message: 'I am going to be the Pirate King!',
            timestamp: new Date(),
        };

        const roomId = mockMessageData.roomId;

        (chatService.saveMessage as jest.Mock).mockResolvedValue(mockMessageData);
        (roomService.getRoomId as jest.Mock).mockReturnValue(roomId);

        await gateway.handleMessage(socket, mockMessageData);

        expect(loggerMock.log).toHaveBeenCalled();

        expect(chatService.saveMessage).toHaveBeenCalledWith(mockMessageData);

        expect(roomService.getRoomId).toHaveBeenCalledWith(socket);

        expect(server.to).toHaveBeenCalledWith(roomId);

        const broadcastOperator = server.to(roomId);
        expect(broadcastOperator.emit).toHaveBeenCalledWith('messageReceived', mockMessageData);
    });

    it('should emit an errorMessage on saveMessage failure', async () => {
        socket.data.username = 'Vegeta';
        socket.data.roomCode = 'room123';
        const mockMessageData: IMessage = {
            roomId: 'room123',
            username: socket.data.username,
            message: 'I am the prince of all Saiyans!',
            timestamp: new Date(),
        };

        const roomId = mockMessageData.roomId;

        const failedMessage = 'Save failed';
        (roomService.getRoomId as jest.Mock).mockReturnValue(roomId);
        (chatService.saveMessage as jest.Mock).mockRejectedValue(new Error(failedMessage));

        await gateway.handleMessage(socket, mockMessageData);

        expect(roomService.getRoomId).toHaveBeenCalledWith(socket);

        expect(chatService.saveMessage).toHaveBeenCalledWith(mockMessageData);

        expect(loggerMock.error).toHaveBeenCalled();

        expect(socket.emit).toHaveBeenCalledWith('errorMessage', 'Failed to send message.');
    });
});
