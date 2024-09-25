import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { Game } from '@app/interfaces/game';
import { mockGames } from '@app/mocks/mock-game';
import { GameListService } from '@app/services/game-list.service';
import { BehaviorSubject, of } from 'rxjs';
import { AdministrationPageComponent } from './administration-page.component';

describe('AdministrationPageComponent', () => {
    let component: AdministrationPageComponent;
    let fixture: ComponentFixture<AdministrationPageComponent>;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;
    let routerMock: jasmine.SpyObj<Router>;
    let activatedRouteMock: jasmine.SpyObj<ActivatedRoute>;

    beforeEach(async () => {
        routerMock = jasmine.createSpyObj('Router', ['navigate']);

        gameListServiceSpy = jasmine.createSpyObj('GameListService', [
            'isListeEmpty',
            'getAllVisibleMaps',
            'selectGame',
            'deselectGame',
            'getGames',
            'getAllGames',
            'setSelectedGame',
            'changeVisibility',
        ]);

        gameListServiceSpy.getGames.and.returnValue(of(mockGames));
        gameListServiceSpy.selectedGame$ = new BehaviorSubject<Game | null>(null).asObservable();

        await TestBed.configureTestingModule({
            imports: [AdministrationPageComponent, GameListComponent],
            providers: [
                { provide: GameListService, useValue: gameListServiceSpy },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AdministrationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should be created', () => {
        expect(component).toBeTruthy();
    });
});
