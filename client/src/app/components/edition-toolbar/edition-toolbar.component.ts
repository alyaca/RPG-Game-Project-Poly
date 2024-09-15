import { Component } from '@angular/core';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { ContainerToolsComponent } from '../container-tools/container-tools.component';
import { EditionGameGridComponent } from '../edition-game-grid/edition-game-grid.component';
import { ToolButtonComponent } from '../tool-button/tool-button.component';
@Component({
    selector: 'app-edition-toolbar',
    standalone: true,
    imports: [EditionGameGridComponent, MatButtonToggle, MatButtonToggleGroup, ContainerToolsComponent, ToolButtonComponent],
    templateUrl: './edition-toolbar.component.html',
    styleUrl: './edition-toolbar.component.scss',
})
export class EditionToolbarComponent {}
