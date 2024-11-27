import { CommonModule } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChatMessageComponent } from '@app/components/chat-message/chat-message.component';
import { ChatMessage } from '@app/interfaces/chat-message';
import { LogMessage } from '@app/interfaces/log-message';
import { ChatService } from '@app/services/sockets/chat/chat.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
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
    @ViewChild('logContainer') logContainer: ElementRef<HTMLDivElement>;
    @Input() isToggleable: boolean;
    @Input() areLogsVisible: boolean = false;
    @Output() chatFocusChange = new EventEmitter<boolean>();

    messages: ChatMessage[] = [];
    logs: LogMessage[] = [];
    filteredLogs: LogMessage[] = [];
    newMessage: string = '';
    newLog: string = '';
    areLogsFiltered: boolean = false;
    chatType: string = 'Messagerie';
    toggleIconImage: string = './assets/images/icones/chat-message.png';
    roomCode: string;
    private routeSub: Subscription;

    constructor(
        private chatService: ChatService,
        private route: ActivatedRoute,
        private socketCommunicationService: SocketCommunicationService,
    ) {}

    get toggleIconClass() {
        return this.areLogsVisible ? 'icon-logs' : 'icon-chat';
    }

    onFocus() {
        this.chatFocusChange.emit(true);
    }

    onBlur() {
        this.chatFocusChange.emit(false);
    }

    scrollToBottom(): void {
        if (this.messageContainer) {
            this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
        }
        if (this.logContainer) {
            this.logContainer.nativeElement.scrollTop = this.logContainer.nativeElement.scrollHeight;
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

        this.chatService.onLogReceived((message: LogMessage) => {
            if (this.isPlayerInLog(message)) {
                this.filteredLogs.push(message);
                this.logs.push(message);
            } else {
                this.logs.push(message);
            }
        });
        this.chatType = this.areLogsVisible ? 'Journal de jeu non filtré' : 'Messagerie';
    }

    isPlayerInLog(message: LogMessage): boolean {
        return message.players.some((player) => player.id === this.socketCommunicationService.socket.id);
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
        if (this.routeSub) {
            this.routeSub.unsubscribe();
        }
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
