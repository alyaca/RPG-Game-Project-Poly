import { Component, Input } from '@angular/core';
import { ToolButtonService } from '@app/services/tool-button/tool-button.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-tool-button',
    standalone: true,
    templateUrl: './tool-button.component.html',
    styleUrl: './tool-button.component.scss',
    imports: [CommonModule],
})
export class ToolButtonComponent {
    @Input() buttonName: string = '';
    isActive: boolean = false;

    constructor(private toolButtonService: ToolButtonService) {}

    get class() {
        const baseClass = this.isActive ? 'active' : '';
        const inactiveClass = this.getInactiveClass();
        return `${baseClass} ${inactiveClass}`.trim();
    }

    toggleSelf() {
        this.toolButtonService.toggleButton(this);
    }

    toggleActivation() {
        this.isActive = !this.isActive;
    }

    private getInactiveClass(): string {
        switch (this.buttonName) {
            case 'Eau':
                return 'water';
            case 'Glace':
                return 'ice';
            case 'Mur':
                return 'wall';
            case 'Porte':
                return 'door';
            default:
                return '';
        }
    }
}
