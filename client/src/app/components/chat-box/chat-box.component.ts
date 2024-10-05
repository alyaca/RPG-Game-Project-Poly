import { Component } from '@angular/core';
import { GameMessage } from '@app/interfaces/message';
import { ChatMessageComponent } from '@app/components/chat-message/chat-message.component';
import { CommonModule } from '@angular/common';
@Component({
    selector: 'app-chat-box',
    standalone: true,
    imports: [ChatMessageComponent, CommonModule],
    templateUrl: './chat-box.component.html',
    styleUrl: './chat-box.component.scss',
})
export class ChatBoxComponent {
    messages: GameMessage[] = [
        {
            id: 0,
            time: '01:58:34',
            sender: 'Obi-Wan',
            content: "Je t'ai laissé tomber Anakin, je t'ai laissé tomber",
        },
        {
            id: 1,
            time: '01:58:38',
            sender: 'Anakin',
            content: "J'aurais dû savoir que les Jedi complotaient pour prendre le pouvoir.",
        },
        {
            id: 2,
            time: '1:58:40',
            sender: 'Obi-Wan',
            content: 'Anakin, le chancelier palpatine est maléfique',
        },
        {
            id: 3,
            time: '01:58:43',
            sender: 'Anakin',
            content: 'De mon point de vue, les Jedi sont mauvais',
        },
        {
            id: 4,
            time: '1:58:45',
            sender: 'Obi-Wan',
            content: 'Eh bien, alors tu es perdu.',
        },
        {
            id: 5,
            time: '01:58:59',
            sender: 'Anakin',
            content: "C'est la fin pour toi mon maître",
        },
        {
            id: 6,
            time: '1:59:27',
            sender: 'Obi-Wan',
            content: "C'est fini Anakin, j'ai le dessus.",
        },
        {
            id: 7,
            time: '01:59:33',
            sender: 'Anakin',
            content: 'Tu sous-estimes mon pouvoir !',
        },
        {
            id: 8,
            time: '01:59:35',
            sender: 'Anakin',
            content: "Ne l'essayes pas",
        },
        {
            id: 9,
            time: '02:00:12',
            sender: 'Obi-Wan',
            content: `Tu étais lélu ! On disait que tu détruirais les Sith, pas que tu les rejoindrais !
                Que tu apporterais léquilibre à la Force, pas que tu la laisserais dans les ténèbres !`,
        },
        {
            id: 10,
            time: '02:00:27',
            sender: 'Anakin',
            content: 'JE TE DÉTESTE',
        },
        {
            id: 11,
            time: '02:00:38',
            sender: 'Obi-Wan',
            content: "Tu étais mon frère, Anakin ! Je t'aimais !",
        },
    ];

    isChatVisible: boolean = false;

    toggleChatVisibility() {
        this.isChatVisible = !this.isChatVisible;
    }
}
