import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CharacterCreatorComponent } from '@app/components/character-creator/character-creator.component';

@Component({
    selector: 'app-join-game',
    standalone: true,
    templateUrl: './join-game.component.html',
    styleUrl: './join-game.component.scss',
    imports: [FormsModule, CommonModule, CharacterCreatorComponent, RouterLink],
})
export class JoinGameComponent {
    accessCode: string;
    fakeCode: string = '1111'; // This is a fake code for testing purposes
    submitForm: boolean;
    isCharacterFormVisible: boolean = false;

    roomExists(accessCode: string): boolean {
        return accessCode === this.fakeCode;
    }

    joinGame(accessCode: string) {
        this.submitForm = true;
        if (this.roomExists(accessCode)) {
            this.isCharacterFormVisible = true;
        }
    }

    hideCharacterForm() {
        this.isCharacterFormVisible = false;
    }
}
