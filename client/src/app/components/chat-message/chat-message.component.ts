import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-chat-message',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './chat-message.component.html',
    styleUrl: './chat-message.component.scss',
})
export class ChatMessageComponent {
    @Input() time: Date;
    @Input() sender: string;
    @Input() content: string;
}
