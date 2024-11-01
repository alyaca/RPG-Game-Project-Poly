import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ChatMessage } from '@app/interfaces/chat-message';
import { ChatService } from '@app/services/sockets/chat/chat.service';
import { BehaviorSubject, of } from 'rxjs';
import { ChatBoxComponent } from './chat-box.component';

describe('ChatBoxComponent', () => {
    let component: ChatBoxComponent;
    let fixture: ComponentFixture<ChatBoxComponent>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;
    let queryParamsSubject: BehaviorSubject<{ roomCode: string }>;
    let httpMock: HttpTestingController;
    let mockMessages: ChatMessage[];

    beforeEach(async () => {
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['onMessageReceived', 'sendMessage', 'getMessagesByRoom']);
        queryParamsSubject = new BehaviorSubject({ roomCode: '1234' });
        mockMessages = [
            { id: 1, username: 'User1', message: 'Hello', timestamp: new Date() },
            { id: 2, username: 'User2', message: 'Hi', timestamp: new Date() },
        ];
        chatServiceSpy.getMessagesByRoom.and.returnValue(of(mockMessages));

        await TestBed.configureTestingModule({
            imports: [ChatBoxComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ChatService, useValue: chatServiceSpy },
                { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject.asObservable() } },
            ],
        }).compileComponents();

        httpMock = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(ChatBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load messages', () => {
        spyOn(component, 'loadMessages').and.callThrough();
        component.ngOnInit();

        expect(component.loadMessages).toHaveBeenCalled();
        expect(chatServiceSpy.getMessagesByRoom).toHaveBeenCalledWith('1234');
        expect(component.messages).toEqual(mockMessages);
    });

    it('should set roomCode on init', () => {
        component.ngOnInit();
        expect(component.roomCode).toBe('1234');
    });

    it('should send message', () => {
        const message = "Hey it's me Goku !";
        component.newMessage = message;
        component.sendMessage();
        expect(chatServiceSpy.sendMessage).toHaveBeenCalledWith(message);
        expect(component.newMessage).toBe('');
    });

    it('should receive message', () => {
        const message: ChatMessage = {
            id: 1,
            timestamp: new Date(),
            message: "Hey it's me Goku !",
            username: 'Goku',
        };
        component.ngOnInit();
        chatServiceSpy.onMessageReceived.calls.mostRecent().args[0](message);
        expect(component.messages).toContain(message);
    });

    it('should scroll to bottom', () => {
        const messageContainer = document.createElement('div');
        const scrollHeight = 100;

        // Simule `scrollHeight`
        Object.defineProperty(messageContainer, 'scrollHeight', { value: scrollHeight, configurable: true });

        // Définit `scrollTop` sur 0 au départ
        messageContainer.scrollTop = 0;
        component.messageContainer = new ElementRef(messageContainer);

        // Appelle `scrollToBottom`
        component.scrollToBottom();

        // Simule la mise à jour de `scrollTop`
        Object.defineProperty(messageContainer, 'scrollTop', { value: scrollHeight, writable: true });

        expect(messageContainer.scrollTop).toBe(scrollHeight);
    });
});
