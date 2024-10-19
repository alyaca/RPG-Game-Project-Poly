import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '@app/interfaces/chatMessage';
import { ChatService } from '@app/services/sockets/chat/chat.service';
import { ChatMessageComponent } from '../chat-message/chat-message.component';

@Component({
    selector: 'app-chat-box',
    standalone: true,
    imports: [ChatMessageComponent, CommonModule, FormsModule],
    templateUrl: './chat-box.component.html',
    styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent implements OnInit {
    messages: ChatMessage[] = [];
    newMessage: string = '';
    isChatVisible: boolean = true;

    constructor(private chatService: ChatService) {}

    ngOnInit(): void {
        this.chatService.onMessageReceived((message: ChatMessage) => {
            this.messages.push(message);
        });
    }

    sendMessage(): void {
        if (this.newMessage.trim()) {
            this.chatService.sendMessage(this.newMessage);
            this.newMessage = '';
        }
    }

    toggleChatVisibility(): void {
        this.isChatVisible = !this.isChatVisible;
    }
}
