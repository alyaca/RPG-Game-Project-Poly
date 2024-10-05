import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-lobby-player',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './lobby-player.component.html',
    styleUrl: './lobby-player.component.scss',
})
export class LobbyPlayerComponent {
    @Input() name!: string;
    @Input() imageSrc!: string;
    @Input() attack!: number;
    @Input() defense!: number;
    @Input() health!: number;
    @Input() speed!: number;
    @Input() sizeClass: 'small' | 'medium' | 'big' = 'medium';
    @Input() isAdmin: boolean = false;
}
