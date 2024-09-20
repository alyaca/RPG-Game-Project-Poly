import { CommonModule, NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { GameCreationService } from '../../services/game-creation.service';

@Component({
    selector: 'app-pop-up',
    standalone: true,
    templateUrl: './popUp.component.html',
    styleUrls: ['./popUp.component.scss'],
    imports: [NgClass, CommonModule],
})
export class PopUpComponent {
    @Input() selectedSize: string;
    @Input() selectedMode: string;

    //gridArray: number[][];
    constructor(
        public dialogRef: MatDialogRef<PopUpComponent>,
        private router: Router,
        private gameCreationService: GameCreationService,
    ) {}

    selectSize(size: string): void {
        this.selectedSize = size;
        this.gameCreationService.setSelectedSize(size);
    }

    selectMode(mode: string): void {
        this.selectedMode = mode;
        console.log(mode);
    }

    close(): void {
        this.dialogRef.close();
    }

    changePage(): void {
        this.router.navigate(['/edit-map']);
        this.dialogRef.close();
    }
}
