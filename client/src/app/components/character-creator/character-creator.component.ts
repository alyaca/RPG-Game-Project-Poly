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
    @Output() closeComponentEvent = new EventEmitter<void>();
    closeComponent() {
        this.closeComponentEvent.emit();
        this.attributesService.resetAttributes();
    }

    avatars = [
        // TODO: Add the other avatars
        { src: '../../../assets/characters/Athena.jpg', name: 'Athena' },
        { src: '../../../assets/characters/Hera.jpg', name: 'Hera' },
        { src: '../../../assets/characters/Zeus.jpg', name: 'Zues' },
        { src: '../../../assets/characters/Athena.jpg', name: 'Athena' },
        { src: '../../../assets/characters/Hera.jpg', name: 'Hera' },
        { src: '../../../assets/characters/Zeus.jpg', name: 'Zues' },
        { src: '../../../assets/characters/Athena.jpg', name: 'Athena' },
        { src: '../../../assets/characters/Hera.jpg', name: 'Hera' },
        { src: '../../../assets/characters/Zeus.jpg', name: 'Zues' },
        { src: '../../../assets/characters/Athena.jpg', name: 'Athena' },
        { src: '../../../assets/characters/Hera.jpg', name: 'Hera' },
        { src: '../../../assets/characters/Zeus.jpg', name: 'Zues' },
    ];

    constructor(
        private attributesService: AttributesService,
        private router: Router,
        private snackBar: MatSnackBar,
    ) {}

    clickedAvatar: { src: string; name: string } = this.avatars[0];

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
