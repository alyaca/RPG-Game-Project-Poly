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

        gameListServiceSpy.getAllVisibleMaps.and.returnValue(of(mockGames));
        gameListServiceSpy.getAllGames.and.returnValue(of(mockGames));
        gameListServiceSpy.isListeEmpty.and.returnValue(of(false));
        gameListServiceSpy.getGames.and.returnValue(of(mockGames));

        gameListServiceSpy.selectedGame$ = new BehaviorSubject<Game | null>(null).asObservable();

        gameListServiceSpy.selectGame.and.callFake((game: Game, games: Game[]) => {
            game.isSelected = true;
        });
        gameListServiceSpy.deselectGame.and.callFake((games: Game[]) => {
            games.forEach((game) => (game.isSelected = false));
        });
        gameListServiceSpy.setSelectedGame.and.callFake((usingPage: string, game: Game, games: Game[]) => {
            gameListServiceSpy.selectGame(game, games);
        });

        activatedRouteMock = jasmine.createSpyObj('ActivatedRoute', [], {
            snapshot: {
                paramMap: {
                    get: jasmine.createSpy('get').and.callFake((key: string) => {
                        const mockParams = { id: '123', name: 'mockName' };
                        return mockParams[key as keyof typeof mockParams];
                    }),
                },
            },
        });

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

    it('should redirect to "/edit-map" if the game list is empty', () => {
        gameListServiceSpy.isListeEmpty.and.returnValue(of(true));
        component.ngOnInit();
        expect(routerMock.navigate).toHaveBeenCalledWith(['/edit-map']);
    });

    it('should NOT redirect if the game list is not empty', () => {
        gameListServiceSpy.isListeEmpty.and.returnValue(of(false));
        component.ngOnInit();
        expect(routerMock.navigate).not.toHaveBeenCalled();
    });
});
