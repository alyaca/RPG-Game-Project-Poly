import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/game';
import { mockGames } from '@app/mocks/mock-game';
import { GameListService } from '@app/services/game-list.service';
import { BehaviorSubject, of } from 'rxjs';
import { GameListComponent } from './game-list.component';

describe('GameListComponent', () => {
    let component: GameListComponent;
    let fixture: ComponentFixture<GameListComponent>;
    let gameListService: jasmine.SpyObj<GameListService>;
    let selectedGameSubject: BehaviorSubject<Game | null>;

    beforeEach(async () => {
        selectedGameSubject = new BehaviorSubject<Game | null>(null);

        const gameListServiceSpy = jasmine.createSpyObj('GameListService', ['getAllVisibleMaps', 'selectGame', 'deselectGame']);

        gameListServiceSpy.getAllVisibleMaps.and.returnValue(of(mockGames));
        gameListServiceSpy.selectGame.and.callFake((game: Game) => {
            game.isSelected = true;
        });
        gameListServiceSpy.deselectGame.and.callFake((games: Game[]) => {
            games.forEach((game) => (game.isSelected = false));
        });
        gameListServiceSpy.selectedGame$ = selectedGameSubject.asObservable(); // Utilise BehaviorSubject

        await TestBed.configureTestingModule({
            imports: [GameListComponent],
            providers: [{ provide: GameListService, useValue: gameListServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameListComponent);
        component = fixture.componentInstance;
        gameListService = TestBed.inject(GameListService) as jasmine.SpyObj<GameListService>;

        fixture.detectChanges();
    });

    afterEach(() => {
        gameListService.getAllVisibleMaps.calls.reset();
        gameListService.selectGame.calls.reset();
        gameListService.deselectGame.calls.reset();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get games on initialization', () => {
        component.ngOnInit();

        expect(gameListService.getAllVisibleMaps).toHaveBeenCalled();
        expect(component.games).toEqual(mockGames);
    });

    it('should select a game and deselect others', () => {
        const gameToSelect: Game = mockGames[0];

        component.selectGame(gameToSelect);

        expect(gameListService.selectGame).toHaveBeenCalledWith(gameToSelect, mockGames);
        expect(gameToSelect.isSelected).toBeTrue();

        mockGames.forEach((game) => {
            if (game._id !== gameToSelect._id) {
                expect(game.isSelected).toBeFalse();
            }
        });
    });

    it('should deselect all games if the selected game is clicked again', () => {
        const selectedGame = mockGames[1];
        selectedGame.isSelected = true;

        component.selectGame(selectedGame);

        expect(gameListService.deselectGame).toHaveBeenCalledWith(mockGames);
        mockGames.forEach((game) => {
            expect(game.isSelected).toBeFalse();
        });
    });

    it('should update selectedGame when gameListService emits a new selection', () => {
        const mockSelectedGame: Game = mockGames[0];
        selectedGameSubject.next(mockSelectedGame);

        component.ngOnInit();

        expect(component.gameSelected).toEqual(mockSelectedGame);
    });
});
