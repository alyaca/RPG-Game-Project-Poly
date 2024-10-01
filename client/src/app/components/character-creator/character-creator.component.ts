import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AttributesService } from '@app/services/attributes.service';

const highAttribute = '6';
const messageDuration = 3000;
@Component({
    selector: 'app-character-creator',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, FormsModule],
    templateUrl: './character-creator.component.html',
    styleUrl: './character-creator.component.scss',
})
export class CharacterCreatorComponent {
    @Output() closeCharactorCreator = new EventEmitter<void>();
    avatars = [
        { src: '/assets/img/characters/Hestia.webp', name: 'Hestia' },
        { src: '/assets/img/characters/Zeus.webp', name: 'Zeus' },
        { src: '/assets/img/characters/Hera.webp', name: 'Hera' },
        { src: '/assets/img/characters/Poseidon.webp', name: 'Poseidon' },
        { src: '/assets/img/characters/Artemis.webp', name: 'Artemis' },
        { src: '/assets/img/characters/Demeter.webp', name: 'Demeter' },
        { src: '/assets/img/characters/Hermes.webp', name: 'Hermes' },
        { src: '/assets/img/characters/Athena.webp', name: 'Athena' },
        { src: '/assets/img/characters/Hephaestus.webp', name: 'Hephaestus' },
        { src: '/assets/img/characters/Apollo.webp', name: 'Apollo' },
        { src: '/assets/img/characters/Ares.webp', name: 'Ares' },
        { src: '/assets/img/characters/Aphrodite.webp', name: 'Aphrodite' },
    ];
    clickedAvatar: { src: string; name: string } = this.avatars[0];
    characterName: string = '';

    constructor(
        private attributesService: AttributesService,
        private router: Router,
        private snackBar: MatSnackBar,
    ) {}

    setName(name: string) {
        this.characterName = name;
    }

    closeComponent() {
        this.closeCharactorCreator.emit();
        this.attributesService.resetAttributes();
    }

    getClickedImage(avatar: { src: string; name: string }) {
        this.clickedAvatar = avatar;
    }

    isButtonSelected(buttonName: string) {
        return this.attributesService.isButtonSelected(buttonName);
    }
    addHealth() {
        this.attributesService.setHealth(highAttribute);
    }

    addSpeed() {
        this.attributesService.setSpeed(highAttribute);
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
        if (saveStatus === undefined) {
            this.router.navigate(['/waiting-page']);
        } else {
            this.snackBar.open(saveStatus as string, 'Fermer', {
                duration: messageDuration,
            });
        }
    }
}
