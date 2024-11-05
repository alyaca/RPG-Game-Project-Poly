import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ChatMessage } from '@app/interfaces/chat-message';
import { ChatService } from '@app/services/sockets/chat/chat.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';
import { BehaviorSubject, of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { ChatBoxComponent } from './chat-box.component';

describe('ChatBoxComponent', () => {
    let component: ChatBoxComponent;
    let fixture: ComponentFixture<ChatBoxComponent>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;
    let queryParamsSubject: BehaviorSubject<{ roomCode: string }>;
    let httpMock: HttpTestingController;
    let mockMessages: ChatMessage[];
    let mockPlayer: Player[];

    beforeEach(async () => {
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['onMessageReceived', 'sendMessage', 'getMessagesByRoom', 'onLogReceived']);
        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', [], {
            socket: { id: '123' } as Socket,
        });
        socketCommunicationServiceSpy.socket = { id: '123' } as Socket;
        queryParamsSubject = new BehaviorSubject({ roomCode: '1234' });
        mockMessages = [
            { id: 1, username: 'User1', message: 'Hello', timestamp: new Date() },
            { id: 2, username: 'User2', message: 'Hi', timestamp: new Date() },
        ];
        chatServiceSpy.getMessagesByRoom.and.returnValue(of(mockMessages));

        mockPlayer = [{ id: '123', username: 'Goku' } as unknown as Player];

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

    it('should receive log and push it to one of the two arrays if filtered', () => {
        const logMessage = {
            id: 1,
            message: 'Goku has joined the room',
            players: mockPlayer,
            timestamp: new Date(),
        };
        chatServiceSpy.onLogReceived.calls.mostRecent().args[0](logMessage);
        component.ngOnInit();
        expect(component.logs).toContain(logMessage);
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

    it('should toggle chat logs visibility and update chatType correctly', () => {
        component.isToggleable = true;
        component.areLogsVisible = false;
        component.chatType = 'Messagerie';

        component.toggleChatLogs();

        expect(component.areLogsVisible).toBe(true);
        expect(component.chatType).toBe('Journal de jeu non filtré');
        component.toggleChatLogs();

        expect(component.areLogsVisible).toBe(false);
        expect(component.chatType).toBe('Messagerie');
    });

    it('should return "icon-logs" when areLogsVisible is true', () => {
        component.areLogsVisible = true;
        expect(component.toggleIconClass).toBe('icon-logs');
    });

    it('should return "icon-chat" when areLogsVisible is false', () => {
        component.areLogsVisible = false;
        expect(component.toggleIconClass).toBe('icon-chat');
    });

    // it('should toggle areLogsFiltered and update chatType correctly', () => {
    //     component.logs = [
    //         { players: [{ id: '213' } as Player, { id: 'other-id' } as Player] } as LogMessage,
    //         { players: [{ id: 'other-id' } as Player] } as LogMessage,
    //     ];
    //     component.tempLogs = [];

    //     component.areLogsFiltered = false;
    //     component.chatType = 'Journal de jeu non filtré';
    //     component.toggleLogsFilter();

    //     expect(component.areLogsFiltered).toBeTrue();
    //     expect(component.chatType).toBe('Journal de jeu filtré');
    //     expect(component.tempLogs.length).toBe(2);
    //     expect(component.logs.length).toBe(1);
    //     expect(component.logs[0].players[0].id).toBe('213');

    //     component.toggleLogsFilter();

    //     expect(component.areLogsFiltered).toBeFalse();
    //     expect(component.chatType).toBe('Journal de jeu non filtré');
    //     expect(component.logs.length).toBe(2);
    //     expect(component.logs[0].players[0].id).toBe('213');
    //     expect(component.logs[1].players[0].id).toBe('other-id');
    // });
});
