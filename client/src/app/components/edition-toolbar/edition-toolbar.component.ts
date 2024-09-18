import { Component } from '@angular/core';
import { ContainerToolsComponent } from '@app/components/container-tools/container-tools.component';
@Component({
    selector: 'app-edition-toolbar',
    standalone: true,
    imports: [ContainerToolsComponent],
    templateUrl: './edition-toolbar.component.html',
    styleUrl: './edition-toolbar.component.scss',
})
export class EditionToolbarComponent {}
