import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessageComponent } from '@app/components/chat-message/chat-message.component';
import { ChatMessage } from '@app/interfaces/chat-message';
import { ChatService } from '@app/services/sockets/chat/chat.service';

@Component({
    selector: 'app-chat-box',
    standalone: true,
    imports: [ChatMessageComponent, CommonModule, FormsModule],
    templateUrl: './chat-box.component.html',
    styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent implements OnInit, AfterViewChecked {
    @ViewChild('messageContainer') messageContainer: ElementRef<HTMLDivElement>;
    messages: ChatMessage[] = [];
    newMessage: string = '';
    // isChatVisible: boolean = true;

    constructor(private chatService: ChatService) {}

    scrollToBottom(): void {
        if (this.messageContainer) {
            this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
        }
    }

    ngOnInit(): void {
        this.chatService.onMessageReceived((message: ChatMessage) => {
            this.messages.push(message);
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

    // toggleChatVisibility(): void {
    //     this.isChatVisible = !this.isChatVisible;
    // }
}
