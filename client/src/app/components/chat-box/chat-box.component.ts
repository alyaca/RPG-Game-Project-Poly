import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild, Input } from '@angular/core';
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
    @Input() isToggleable: boolean;
    messages: ChatMessage[] = [];
    logs: ChatMessage[] = [
        {
            id: 0,
            timestamp: new Date(),
            username: '',
            message: 'Voici le journal de jeu',
        },
    ];
    newMessage: string = '';
    newLog: string = 'lalala';
    areLogsVisible: boolean = false;
    chatType: string = 'Messagerie';
    toggleIconImage: string = './assets/images/icones/chat-message.png';

    constructor(private chatService: ChatService) {}

    get toggleIconClass() {
        return this.areLogsVisible ? 'icon-logs' : 'icon-chat';
    }

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
        if (this.newMessage.trim() && !this.areLogsVisible) {
            this.chatService.sendMessage(this.newMessage);
            this.newMessage = '';
        }
    }

    toggleChatLogs() {
        if (this.isToggleable) {
            this.areLogsVisible = !this.areLogsVisible;
            this.chatType = this.areLogsVisible ? 'Journal de jeu' : 'Messagerie';
        }
    }
}
