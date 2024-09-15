import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
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
    constructor(
        private attributesService: AttributesService,
        private router: Router,
    ) {}
    avatars = [
        { src: '../../../assets/characters/Athena.jpg', name: 'Athena', description: 'TODO' },
        { src: '../../../assets/characters/Hera.jpg', name: 'Hera', description: 'TODO' },
        { src: '../../../assets/characters/Zeus.jpg', name: 'Zues', description: 'TODO' },
        { src: '../../../assets/characters/Athena.jpg', name: 'Athena', description: 'TODO' },
        { src: '../../../assets/characters/Hera.jpg', name: 'Hera', description: 'TODO' },
        { src: '../../../assets/characters/Zeus.jpg', name: 'Zues', description: 'TODO' },
        { src: '../../../assets/characters/Athena.jpg', name: 'Athena', description: 'TODO' },
        { src: '../../../assets/characters/Hera.jpg', name: 'Hera', description: 'TODO' },
        { src: '../../../assets/characters/Zeus.jpg', name: 'Zues', description: 'TODO' },
        { src: '../../../assets/characters/Athena.jpg', name: 'Athena', description: 'TODO' },
        { src: '../../../assets/characters/Hera.jpg', name: 'Hera', description: 'TODO' },
        { src: '../../../assets/characters/Zeus.jpg', name: 'Zues', description: 'TODO' },
    ];

    clickedAvatar: { src: string; name: string; description: string } = this.avatars[0];

    getClickedImage(avatar: { src: string; name: string; description: string }) {
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
        }
    }

    @Output() close = new EventEmitter<void>();
    closeComponent() {
        this.close.emit();
        this.attributesService.resetAttributes();
    }
}
