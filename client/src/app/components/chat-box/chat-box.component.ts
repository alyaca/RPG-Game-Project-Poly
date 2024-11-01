import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChatMessageComponent } from '@app/components/chat-message/chat-message.component';
import { ChatMessage } from '@app/interfaces/chat-message';
import { ChatService } from '@app/services/sockets/chat/chat.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-chat-box',
    standalone: true,
    imports: [ChatMessageComponent, CommonModule, FormsModule],
    templateUrl: './chat-box.component.html',
    styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent implements OnInit, AfterViewChecked, OnDestroy {
    @ViewChild('messageContainer') messageContainer: ElementRef<HTMLDivElement>;
    messages: ChatMessage[] = [];
    newMessage: string = '';
    roomCode: string;
    private routeSub: Subscription;
    // isChatVisible: boolean = true;

    constructor(
        private chatService: ChatService,
        private route: ActivatedRoute,
    ) {}

    scrollToBottom(): void {
        if (this.messageContainer) {
            this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
        }
    }

    ngOnInit(): void {
        this.routeSub = this.route.queryParams.subscribe((params) => {
            this.roomCode = params['roomCode'];
            this.loadMessages();
        });
        this.chatService.onMessageReceived((message: ChatMessage) => {
            this.messages.push(message);
        });
    }

    loadMessages(): void {
        this.chatService.getMessagesByRoom(this.roomCode).subscribe((messages) => {
            if (messages.length !== 0) {
                this.messages = messages;
            }
        });
    }

    ngAfterViewChecked(): void {
        this.scrollToBottom();
    }

    sendMessage(): void {
        if (this.newMessage.trim()) {
            this.chatService.sendMessage(this.newMessage);
            this.newMessage = '';
        }
    }

    ngOnDestroy(): void {
        this.routeSub.unsubscribe();
    }

    // toggleChatVisibility(): void {
    //     this.isChatVisible = !this.isChatVisible;
    // }
}
