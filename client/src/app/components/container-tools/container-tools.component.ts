import { Component } from '@angular/core';
import { ToolButtonComponent } from '../tool-button/tool-button.component';

@Component({
    selector: 'app-container-tools',
    standalone: true,
    imports: [ToolButtonComponent],
    templateUrl: './container-tools.component.html',
    styleUrl: './container-tools.component.scss',
})
export class ContainerToolsComponent {
    names: string[] = ["Tuile d'eau", 'Tuile de glace', 'Tuile de mur', 'Tuile de porte'];
    ids: string[] = ['water-tool', 'ice-tool', 'wall-tool', 'door-tool'];
    selectedButton: ToolButtonComponent | null = null;

    toggleButton(buttonToActivate: ToolButtonComponent) {
        if (this.selectedButton == null) {
            this.selectedButton = buttonToActivate;
            buttonToActivate.toggleActivation();

            console.log(buttonToActivate.isActive);
        } else if (this.selectedButton == buttonToActivate) {
            this.selectedButton.toggleActivation();
            this.selectedButton = null;

            console.log(buttonToActivate.isActive);
        } else {
            this.selectedButton.toggleActivation();
            this.selectedButton = buttonToActivate;
            buttonToActivate.toggleActivation();

            console.log(buttonToActivate.isActive);
        }
    }
}
