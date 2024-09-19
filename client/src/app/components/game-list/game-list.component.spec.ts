import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/game';
import { mockGames } from '@app/mocks/mock-game';
import { GameListService } from '@app/services/game-list.service';
import { BehaviorSubject, of } from 'rxjs';
import { GameListComponent } from './game-list.component';

describe('GameListComponent', () => {
    let component: GameListComponent;
    let fixture: ComponentFixture<GameListComponent>;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;
    let selectedGameSubject: BehaviorSubject<Game | null>;

    beforeEach(async () => {
        selectedGameSubject = new BehaviorSubject<Game | null>(null);

        gameListServiceSpy = jasmine.createSpyObj('GameListService', ['getAllVisibleMaps', 'selectGame', 'deselectGame']);
        gameListServiceSpy.getAllVisibleMaps.and.returnValue(of(mockGames));
        gameListServiceSpy.selectGame.and.callFake((game: Game) => {
            game.isSelected = true;
        });
        gameListServiceSpy.deselectGame.and.callFake((games: Game[]) => {
            games.forEach((game) => (game.isSelected = false));
        });
        gameListServiceSpy.selectedGame$ = selectedGameSubject.asObservable();

        await TestBed.configureTestingModule({
            imports: [GameListComponent],
            providers: [{ provide: GameListService, useValue: gameListServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(GameListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get games on initialization', () => {
        expect(gameListServiceSpy.getAllVisibleMaps).toHaveBeenCalled();
        expect(component.games).toEqual(mockGames);
    });

    it('should select a game and deselect others', () => {
        const gameToSelect: Game = mockGames[0];

        component.selectGame(gameToSelect);

        expect(gameListServiceSpy.selectGame).toHaveBeenCalledWith(gameToSelect, mockGames);
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

        expect(gameListServiceSpy.deselectGame).toHaveBeenCalledWith(mockGames);
        mockGames.forEach((game) => {
            expect(game.isSelected).toBeFalse();
        });
    });

    it('should update selectedGame when gameListService emits a new selection', () => {
        const mockSelectedGame: Game = mockGames[0];
        selectedGameSubject.next(mockSelectedGame);

        fixture.detectChanges(); // Assure-toi que les changements sont détectés

        expect(component.gameSelected).toEqual(mockSelectedGame);
    });
});
