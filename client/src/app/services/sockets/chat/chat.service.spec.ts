import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { IMessage } from '@app/interfaces/backend-interfaces/message.interface';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { environment } from 'src/environments/environment';
import { ChatService } from './chat.service';

describe('ChatService', () => {
    let service: ChatService;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;
    let httpMock: HttpTestingController;
    const chatsUrl = `${environment.serverUrl}/chat`;

    beforeEach(() => {
        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['send', 'on']);

        TestBed.configureTestingModule({
            imports: [],
            providers: [
                ChatService,
                {
                    provide: SocketCommunicationService,
                    useValue: socketCommunicationServiceSpy,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });
        service = TestBed.inject(ChatService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should send message', () => {
        const username = 'Player';
        const content = "Hey it's me Goku !";
        service.sendMessage(content);
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('sendMessages', {
            username,
            message: content,
            timestamp: jasmine.any(Date),
        });
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

    it('should get messages by room', () => {
        const roomCode = 'room123';
        const mockMessages: IMessage[] = [
            { username: 'User1', message: 'Hello', timestamp: new Date() },
            { username: 'User2', message: 'Hi', timestamp: new Date() },
        ];

        service.getMessagesByRoom(roomCode).subscribe((messages) => {
            expect(messages).toEqual(mockMessages);
        });

        const req = httpMock.expectOne((request) => request.url === chatsUrl && request.params.has('roomCode'));
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('roomCode')).toBe(roomCode);
        req.flush(mockMessages);
    });
});
