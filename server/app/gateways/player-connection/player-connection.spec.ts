import { RoomService } from '@app/services/room/room.service';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Server, Socket } from 'socket.io';
import { PlayerConnectionGateway } from './player-connection.gateway';

describe('PlayerConnection', () => {
    let gateway: PlayerConnectionGateway;
    let socket: SinonStubbedInstance<Socket>;
    let server: SinonStubbedInstance<Server>;
    let roomService: RoomService;

    beforeEach(async () => {
        const roomServiceMock = {
            setServer: jest.fn(),
        };

        socket = createStubInstance<Socket>(Socket);
        server = createStubInstance<Server>(Server);
        const module: TestingModule = await Test.createTestingModule({
            providers: [PlayerConnectionGateway, { provide: RoomService, useValue: roomServiceMock }],
        }).compile();

        gateway = module.get<PlayerConnectionGateway>(PlayerConnectionGateway);
        roomService = module.get<RoomService>(RoomService);
    });

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should call setServer on roomService when onModuleInit is called', () => {
        const mockServer = {} as Server;
        gateway['server'] = mockServer;

        gateway.onModuleInit();
        expect(roomService.setServer).toHaveBeenCalledWith(mockServer);
    });
});
