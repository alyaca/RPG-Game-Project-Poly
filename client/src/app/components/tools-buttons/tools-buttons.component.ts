import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-tools-buttons',
    standalone: true,
    imports: [],
    templateUrl: './tools-buttons.component.html',
    styleUrl: './tools-buttons.component.scss',
})
export class ToolsButtonsComponent {
    @Input() tileType: string;
    @Input() imgFilePath: string;
    @Output() onClick = new EventEmitter<any>();

    active: boolean = false;

    onClickButton() {
        this.onClick.emit(this.tileType);
    }
}
