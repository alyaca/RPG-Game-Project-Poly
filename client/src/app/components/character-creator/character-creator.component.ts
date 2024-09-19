import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AttributesService } from '@app/services/attributes.service';

@Component({
    selector: 'app-character-creator',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    templateUrl: './character-creator.component.html',
    styleUrl: './character-creator.component.scss',
})
export class CharacterCreatorComponent {
    @Output() closeCharactorCreator = new EventEmitter<void>();
    avatars = [
        { src: '../../../assets/img/characters/Athena.webp', name: 'Athena' },
        { src: '../../../assets/img/characters/Hera.webp', name: 'Hera' },
        { src: '../../../assets/img/characters/Zeus.webp', name: 'Zues' },
        { src: '../../../assets/img/characters/Apollo.webp', name: 'Apollo' },
        { src: '../../../assets/img/characters/Aphrodlte.webp', name: 'Aphrodlte' },
        { src: '../../../assets/img/characters/Ares.webp', name: 'Ares' },
        { src: '../../../assets/img/characters/Artemis.webp', name: 'Artemis' },
        { src: '../../../assets/img/characters/Demeter.webp', name: 'Demeter' },
        { src: '../../../assets/img/characters/Hephaestus.webp', name: 'Hephaestus' },
        { src: '../../../assets/img/characters/Hermes.webp', name: 'Hermes' },
        { src: '../../../assets/img/characters/Hestia.webp', name: 'Hestia' },
        { src: '../../../assets/img/characters/Poseidon.webp', name: 'Poseidon' },
    ];
    clickedAvatar: { src: string; name: string } = this.avatars[0];
    constructor(
        private attributesService: AttributesService,
        private router: Router,
        private snackBar: MatSnackBar,
    ) {}

    closeComponent() {
        this.closeCharactorCreator.emit();
        this.attributesService.resetAttributes();
    }

    getClickedImage(avatar: { src: string; name: string }) {
        this.clickedAvatar = avatar;
    }

    addHealth() {
        this.attributesService.setHealth('6');
    }

    addspeed() {
        this.attributesService.setSpeed('6');
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
        if (this.attributesService.saveAttributesValue()) {
            this.router.navigate(['/waiting']);
            this.attributesService.resetAttributes();
        } else {
            this.snackBar.open('Veuillez sélectionner les valeurs des attributs souhaités', 'Fermer', {
                duration: 2000,
            });
        }
    }
}
