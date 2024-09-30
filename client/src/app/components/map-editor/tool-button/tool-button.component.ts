import { Component, Input } from '@angular/core';
import { ToolButtonService } from '@app/services/tool-button/tool-button.service';

@Component({
    selector: 'app-tool-button',
    standalone: true,
    templateUrl: './tool-button.component.html',
    styleUrl: './tool-button.component.scss',
})
export class ToolButtonComponent {
    @Input() buttonName: string = '';
    isActive: boolean = false;
    class: string = 'inactive';

    constructor(private toolButtonService: ToolButtonService) {}

    toggleSelf() {
        this.toolButtonService.toggleButton(this);
    }

    toggleActivation() {
        this.isActive = !this.isActive;
        this.class = this.isActive ? 'active' : 'inactive';
    }
}
