import { Component, Input } from '@angular/core';
import { ContainerToolsComponent } from '../container-tools/container-tools.component';

@Component({
    selector: 'app-tool-button',
    standalone: true,
    imports: [],
    templateUrl: './tool-button.component.html',
    styleUrl: './tool-button.component.scss',
})
export class ToolButtonComponent {
    @Input() buttonName: string = '';
    isActive: boolean = false;
    class: string = 'inactive';

    constructor(private container: ContainerToolsComponent) {}

    toggleSelf() {
        this.container.toggleButton(this);
    }

    toggleActivation() {
        this.isActive = !this.isActive;
        if (this.isActive) {
            this.class = 'active';
        } else {
            this.class = 'inactive';
        }
    }
}
