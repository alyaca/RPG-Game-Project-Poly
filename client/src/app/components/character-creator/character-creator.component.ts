import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { avatars } from '@app/avatarsInfo';
import { HIGH_ATTRIBUTE, MESSAGE_DURATION_SAVE_CHOICE } from '@app/constants';
import { AttributesService } from '@app/services/attributes.service';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';
import { Avatar, Player } from '@common/player';

@Component({
    selector: 'app-character-creator',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, FormsModule],
    templateUrl: './character-creator.component.html',
    styleUrl: './character-creator.component.scss',
})
export class CharacterCreatorComponent {
    @Output() closeCharacterCreator = new EventEmitter<void>();
    @Output() confirmCharacterSelection = new EventEmitter<void>();
    avatars = avatars;
    clickedAvatar: Avatar = this.avatars[0];
    characterName: string = '';

    constructor(
        private attributesService: AttributesService,
        private snackBar: MatSnackBar,
        private playerConnectionService: PlayerConnectionService,
    ) {}

    setName(name: string) {
        this.characterName = name;
    }

    closeComponent() {
        this.closeCharacterCreator.emit();
        this.attributesService.resetAttributes();
    }

    getClickedImage(avatar: Avatar) {
        this.clickedAvatar = avatar;
        this.playerConnectionService.send('selectCharacter', avatar);
    }

    isButtonSelected(buttonName: string) {
        return this.attributesService.isButtonSelected(buttonName);
    }
    addHealth() {
        this.attributesService.setHealth(HIGH_ATTRIBUTE);
    }

    addSpeed() {
        this.attributesService.setSpeed(HIGH_ATTRIBUTE);
    }

    setAttack(attackValue: string) {
        this.attributesService.setAttack(attackValue);
    }

    setDefense(defenseValue: string) {
        this.attributesService.setDefense(defenseValue);
    }

    getAttributsValue(chosenAttribute: string) {
        return this.attributesService.getAttributsValue(chosenAttribute);
    }

    saveChoices() {
        this.attributesService.setCharacterName(this.characterName);
        const saveStatus = this.attributesService.saveAttributesValue();
        if (saveStatus) {
            this.snackBar.open(saveStatus as string, 'Fermer', {
                duration: MESSAGE_DURATION_SAVE_CHOICE,
            });
        } else {
            this.confirmCharacterSelection.emit();
        }
    }

    createPlayer() {
        const player: Player = { id: 'test', name: this.characterName, avatar: this.clickedAvatar };
        return player;
    }
}
