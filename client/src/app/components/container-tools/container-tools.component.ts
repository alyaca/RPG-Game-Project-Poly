import { Component } from '@angular/core';
import { ToolButtonComponent } from '@app/components/tool-button/tool-button.component';

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
}
