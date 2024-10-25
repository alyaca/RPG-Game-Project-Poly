import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MESSAGE_DURATION_VALIDATION_ERROR } from '@app/constants';
import { AttributesService } from '@app/services/attributes/attributes.service';
import { avatars } from '@common/avatars-info';
import { Avatar, Player, PlayerStats, Status } from '@common/player';

@Component({
    selector: 'app-character-creator',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, FormsModule],
    templateUrl: './character-creator.component.html',
    styleUrl: './character-creator.component.scss',
})
export class CharacterCreatorComponent implements OnDestroy {
    @Input() availableAvatars: Avatar[] = [];
    @Output() closeCharacterCreator = new EventEmitter<void>();
    @Output() confirmCharacterSelection = new EventEmitter<Player>();
    @Output() selectCharacter = new EventEmitter<Avatar>();

    avatars = avatars;
    clickedAvatar: Avatar | undefined;
    characterName: string = '';
    player: Player;
    attributes: PlayerStats;

    constructor(
        private attributesService: AttributesService,
        private snackBar: MatSnackBar,
    ) {
        this.attributesService.resetAttributes();
    }

    ngOnDestroy(): void {
        this.resetClickedImage();
        this.clickedAvatar = undefined;
    }

    setName(name: string) {
        this.characterName = name;
    }

    closeComponent() {
        this.attributesService.resetAttributes();
        this.setAttributes();
        this.closeCharacterCreator.emit();
    }

    resetClickedImage() {
        if (this.clickedAvatar) {
            this.clickedAvatar.isSelected = false;
        }
    }

    getClickedImage(avatar: Avatar) {
        this.resetClickedImage();
        avatar.isSelected = true;
        this.clickedAvatar = avatar;
        this.selectCharacter.emit(this.clickedAvatar);
    }

    isButtonSelected(buttonName: string) {
        return this.attributesService.isButtonSelected(buttonName);
    }

    getAttributValue(attribute: keyof PlayerStats) {
        return this.attributesService.getAttributValue(attribute);
    }

    addHealth() {
        this.attributesService.setHealth();
    }

    addSpeed() {
        this.attributesService.setSpeed();
    }

    setAttack(dice: string) {
        this.attributesService.setAttack(dice);
    }

    setDefense(dice: string) {
        this.attributesService.setDefense(dice);
    }

    diceDisplay(chosenAttribute: keyof PlayerStats) {
        return this.attributesService.getDiceMessage(chosenAttribute);
    }

    saveChoices() {
        this.attributesService.setCharacterName(this.characterName);
        const saveStatus = this.attributesService.saveAttributesValue();
        if (!this.clickedAvatar) {
            this.showSaveErroMessage('Veuillez sélectionner un avatar');
            return;
        }
        if (saveStatus.length > 1) {
            this.showSaveErroMessage(saveStatus);
            return;
        }
        this.setAttributes();
        this.createPlayer();
        this.confirmCharacterSelection.emit(this.player);
    }

    setAttributes() {
        this.attributes = this.attributesService.attributes;
    }

    createPlayer() {
        this.player = {
            id: 'test',
            attributes: this.attributes,
            avatar: this.clickedAvatar,
            isActive: false,
            name: this.characterName,
            status: Status.Player,
            victories: 0,
        };
    }

    preventSpace(event: KeyboardEvent): void {
        if (event.key === ' ') {
            this.showSaveErroMessage('Le nom ne peut pas contenir des espaces');
            event.preventDefault();
        }
    }

    private showSaveErroMessage(message: string): void {
        this.snackBar.open(message, 'Fermer', {
            duration: MESSAGE_DURATION_VALIDATION_ERROR,
        });
    }
}
