import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { Game } from '@app/interfaces/game';
import { mockGames } from '@app/mocks/mock-game';
import { GameListService } from '@app/services/game-list.service';
import { BehaviorSubject, of } from 'rxjs';
import { CreateGamePageComponent } from './create-game-page.component';

describe('CreateGamePageComponent', () => {
    let component: CreateGamePageComponent;
    let fixture: ComponentFixture<CreateGamePageComponent>;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let selectedGameSubject: BehaviorSubject<Game | null>;

    beforeEach(async () => {
        selectedGameSubject = new BehaviorSubject<Game | null>(null);
        gameListServiceSpy = jasmine.createSpyObj('GameListService', ['getAllVisibleMaps', 'selectGame', 'deselectGame']);
        gameListServiceSpy.getAllVisibleMaps.and.returnValue(of(mockGames));
        activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], { snapshot: { paramMap: { get: () => 'mockValue' } } });
        gameListServiceSpy.selectGame.and.callFake((game: Game) => {
            game.isSelected = true;
        });
        gameListServiceSpy.deselectGame.and.callFake((games: Game[]) => {
            games.forEach((game) => (game.isSelected = false));
        });
        gameListServiceSpy.selectedGame$ = selectedGameSubject.asObservable();

        await TestBed.configureTestingModule({
            imports: [CreateGamePageComponent, GameListComponent],
            providers: [
                { provide: GameListService, useValue: gameListServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
