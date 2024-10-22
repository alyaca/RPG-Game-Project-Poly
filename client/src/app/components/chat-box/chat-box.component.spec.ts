import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatMessage } from '@app/interfaces/chatMessage';
import { ChatService } from '@app/services/sockets/chat/chat.service';
import { ChatBoxComponent } from './chat-box.component';

describe('ChatBoxComponent', () => {
    let component: ChatBoxComponent;
    let fixture: ComponentFixture<ChatBoxComponent>;
    let chatServiceSpy: jasmine.SpyObj<ChatService>;

    beforeEach(async () => {
        chatServiceSpy = jasmine.createSpyObj('ChatService', ['onMessageReceived', 'sendMessage']);

        await TestBed.configureTestingModule({
            imports: [ChatBoxComponent],
            providers: [{ provide: ChatService, useValue: chatServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle chat visibility', () => {
        component.isChatVisible = false;
        component.toggleChatVisibility();
        expect(component.isChatVisible).toBe(true);
        component.toggleChatVisibility();
        expect(component.isChatVisible).toBe(false);
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
});
