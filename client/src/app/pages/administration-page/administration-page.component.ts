import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { GameListService } from '@app/services/game-list.service';

@Component({
    selector: 'app-administration-page',
    standalone: true,
    templateUrl: './administration-page.component.html',
    styleUrls: ['./administration-page.component.scss'],
    imports: [CommonModule, RouterLink, GameListComponent],
})
export class AdministrationPageComponent implements OnInit {
    constructor(
        private gameListService: GameListService,
        private router: Router,
    ) {}

    ngOnInit() {
        this.gameListService.isListeEmpty().subscribe((isEmpty) => {
            if (isEmpty) {
                this.router.navigate(['/edit-map']);
            }
        });
    }
}
