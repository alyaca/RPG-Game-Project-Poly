import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharacterCreatorComponent } from '@app/components/character-creator/character-creator.component';
import { GameListComponent } from '@app/components/game-list/game-list.component';

@Component({
    selector: 'app-create-game-page',
    standalone: true,
    imports: [GameListComponent, RouterLink, CharacterCreatorComponent, CommonModule],
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss', '../../../common/css/game-list-page.scss']
})
export class CreateGamePageComponent {
    isComponentVisible: boolean = false;

    showComponent() {
        this.isComponentVisible = true;
    }

    hideComponent() {
        this.isComponentVisible = false;
    }
}
