import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HIGH_ATTRIBUTE, MESSAGE_DURATION_SAVE_CHOICE } from '@app/constants';
import { AttributesService } from '@app/services/attributes.service';
import { avatars } from '@common/avatarsInfo';
import { Avatar, Player } from '@common/player';

@Component({
    selector: 'app-character-creator',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, FormsModule],
    templateUrl: './character-creator.component.html',
    styleUrl: './character-creator.component.scss',
})
export class CharacterCreatorComponent {
    @Input() availableAvatars: Avatar[] = [];
    @Output() closeCharacterCreator = new EventEmitter<void>();
    @Output() confirmCharacterSelection = new EventEmitter<Player>();
    @Output() selectCharacter = new EventEmitter<Avatar>();

    avatars = avatars;
    clickedAvatar: Avatar = this.avatars[0]; // change that
    characterName: string = '';
    player: Player;

    constructor(
        private attributesService: AttributesService,
        private snackBar: MatSnackBar,
    ) {}

    setName(name: string) {
        this.characterName = name;
    }

    closeComponent() {
        this.closeCharacterCreator.emit();
        this.attributesService.resetAttributes();
    }

    getClickedImage(avatar: Avatar) {
        if (this.clickedAvatar) {
            this.clickedAvatar.isSelected = false;
        }
        avatar.isSelected = true;
        this.clickedAvatar = avatar;
        this.selectCharacter.emit(this.clickedAvatar);
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
            this.createPlayer();
            this.confirmCharacterSelection.emit(this.player);
        }
    }

    createPlayer() {
        this.player = { id: 'test', name: this.characterName, avatar: this.clickedAvatar };
    }
}
