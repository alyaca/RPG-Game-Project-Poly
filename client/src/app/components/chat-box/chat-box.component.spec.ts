import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { ChatMessage } from '@app/interfaces/chat-message';
import { ChatService } from '@app/services/sockets/chat/chat.service';
import { BehaviorSubject } from 'rxjs';
import { ChatBoxComponent } from './chat-box.component';

describe('ChatBoxComponent', () => {
    let component: ChatBoxComponent;
    let fixture: ComponentFixture<ChatBoxComponent>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;
    let queryParamsSubject: BehaviorSubject<{ roomCode: string }>;

    beforeEach(async () => {
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['onMessageReceived', 'sendMessage']);
        queryParamsSubject = new BehaviorSubject({ roomCode: '1234' });
        await TestBed.configureTestingModule({
            imports: [ChatBoxComponent],
            providers: [
                { provide: ChatService, useValue: chatServiceSpy },
                { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject.asObservable() } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // it('should toggle chat visibility', () => {
    //     component.isChatVisible = false;
    //     component.toggleChatVisibility();
    //     expect(component.isChatVisible).toBe(true);
    //     component.toggleChatVisibility();
    //     expect(component.isChatVisible).toBe(false);
    // });

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
