import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
    newLog: string = '';
    areLogsVisible: boolean = false;
    areLogsFiltered: boolean = false;
    chatType: string = 'Messagerie';
    toggleIconImage: string = './assets/images/icones/chat-message.png';
    roomCode: string;
    private routeSub: Subscription;

    constructor(
        private chatService: ChatService,
        private route: ActivatedRoute,
    ) {}

    get toggleIconClass() {
        return this.areLogsVisible ? 'icon-logs' : 'icon-chat';
    }

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
        if (this.newMessage.trim() && !this.areLogsVisible) {
            this.chatService.sendMessage(this.newMessage);
            this.newMessage = '';
        }
    }

    ngOnDestroy(): void {
        this.routeSub.unsubscribe();
    }

    toggleChatLogs() {
        if (this.isToggleable) {
            this.areLogsVisible = !this.areLogsVisible;
            this.chatType = this.areLogsVisible ? 'Journal de jeu non filtré' : 'Messagerie';
        }
    }

    toggleLogsFilter() {
        this.areLogsFiltered = !this.areLogsFiltered;
        this.chatType = this.areLogsFiltered ? 'Journal de jeu filtré' : 'Journal de jeu non filtré';
    }
}
