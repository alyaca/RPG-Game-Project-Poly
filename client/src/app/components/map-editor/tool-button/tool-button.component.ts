import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TileButtonName, TileClass } from '@app/constants';
import { ToolButtonService } from '@app/services/tool-button/tool-button.service';

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

    private getInactiveClass() {
        switch (this.buttonName) {
            case TileButtonName.Water:
                return TileClass.Water;
            case TileButtonName.Ice:
                return TileClass.Ice;
            case TileButtonName.Wall:
                return TileClass.Wall;
            case TileButtonName.Door:
                return TileClass.Door;
            default:
                return '';
        }
    }
}
