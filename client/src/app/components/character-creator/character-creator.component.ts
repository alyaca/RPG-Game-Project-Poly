import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HIGH_ATTRIBUTE, MESSAGE_DURATION_SAVE_CHOICE } from '@app/constants';
import { AttributesService } from '@app/services/attributes.service';

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
    avatars = [
        { src: '/assets/images/characters/Hestia.webp', name: 'Hestia' },
        { src: '/assets/images/characters/Zeus.webp', name: 'Zeus' },
        { src: '/assets/images/characters/Hera.webp', name: 'Hera' },
        { src: '/assets/images/characters/Poseidon.webp', name: 'Poseidon' },
        { src: '/assets/images/characters/Artemis.webp', name: 'Artemis' },
        { src: '/assets/images/characters/Demeter.webp', name: 'Demeter' },
        { src: '/assets/images/characters/Hermes.webp', name: 'Hermes' },
        { src: '/assets/images/characters/Athena.webp', name: 'Athena' },
        { src: '/assets/images/characters/Hephaestus.webp', name: 'Hephaestus' },
        { src: '/assets/images/characters/Apollo.webp', name: 'Apollo' },
        { src: '/assets/images/characters/Ares.webp', name: 'Ares' },
        { src: '/assets/images/characters/Aphrodite.webp', name: 'Aphrodite' },
    ];
    clickedAvatar: { src: string; name: string } = this.avatars[0];
    characterName: string = '';

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

    getClickedImage(avatar: { src: string; name: string }) {
        this.clickedAvatar = avatar;
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
}
