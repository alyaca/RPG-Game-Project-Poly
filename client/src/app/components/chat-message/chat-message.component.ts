import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-chat-message',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chat-message.component.html',
    styleUrl: './chat-message.component.scss',
})
export class ChatMessageComponent {
    @Input() timestamp: Date;
    @Input() username: string;
    @Input() message: string;
}
