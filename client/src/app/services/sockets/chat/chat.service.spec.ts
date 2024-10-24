import { TestBed } from '@angular/core/testing';
import { IMessage } from '@app/interfaces/backend-interfaces/message.interface';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { ChatService } from './chat.service';

describe('ChatService', () => {
    let service: ChatService;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;

    beforeEach(() => {
        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['send', 'on']);

        TestBed.configureTestingModule({ providers: [{ provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy }] });
        service = TestBed.inject(ChatService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should send message', () => {
        const username = 'Player';
        const content = "Hey it's me Goku !";
        const message: IMessage = {
            username,
            message: content,
            timestamp: new Date(), 
        };
        service.sendMessage(content);
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('sendMessage', message);
    });

    it('should receive message', () => {
        const message: IMessage = {  
            username: 'Goku',
            message: "Hey it's me Goku !",
            timestamp: new Date(),
        };
        const callback = jasmine.createSpy();
        service.onMessageReceived(callback);
        socketCommunicationServiceSpy.on.calls.mostRecent().args[1](message);
        expect(callback).toHaveBeenCalled();
    });
});
