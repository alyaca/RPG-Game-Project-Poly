import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
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
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

    beforeEach(async () => {
        selectedGameSubject = new BehaviorSubject<Game | null>(null);
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

        gameListServiceSpy = jasmine.createSpyObj('GameListService', [
            'getAllVisibleMaps',
            'selectGame',
            'deselectGame',
            'getGames',
            'changeVisibility',
            'deleteGame',
            'setSelectedGame',
            'getAllGames',
        ]);

        await TestBed.configureTestingModule({
            imports: [MatSnackBarModule, BrowserAnimationsModule],
            providers: [{ provide: MatSnackBar, useValue: snackBarSpy }],
        }).compileComponents();
        gameListServiceSpy.getGames.and.returnValue(of(mockGames));
        gameListServiceSpy.getAllVisibleMaps.and.returnValue(of(mockGames));
        gameListServiceSpy.setSelectedGame.and.callFake((usingPage: string, game: Game, games: Game[]) => {
            if (usingPage === 'game-list') {
                games.forEach((g) => (g.isSelected = false));
                game.isSelected = true;
            }
        });

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
        expect(gameListServiceSpy.getGames).toHaveBeenCalled();
        expect(component.games).toEqual(mockGames);
    });

    it('should select a game and deselect others', () => {
        const gameToSelect: Game = { ...mockGames[0] };
        component.usingPage = 'game-list';
        component.selectGame(gameToSelect);
        expect(gameListServiceSpy.setSelectedGame).toHaveBeenCalledWith(component.usingPage, gameToSelect, mockGames);
        expect(gameToSelect.isSelected).toBeTrue();
        mockGames.forEach((game) => {
            if (game._id !== gameToSelect._id) {
                expect(game.isSelected).toBeFalse();
            }
        });
    });

    it('should update selectedGame when gameListService emits a new selection', () => {
        const mockSelectedGame: Game = mockGames[0];
        selectedGameSubject.next(mockSelectedGame);
        fixture.detectChanges();
        expect(component.gameSelected).toEqual(mockSelectedGame);
    });

    it('should call changeVisibility and handle error message on failure', () => {
        const game: Game = { ...mockGames[0] };
        gameListServiceSpy.changeVisibility.and.returnValue(of(false));
        spyOn(component, 'showErrorMessage');
        component.changeVisibility(game);
        expect(component.showErrorMessage).toHaveBeenCalled();
    });

    it('should refresh the game list when deleteGame is successful', () => {
        const game: Game = { ...mockGames[0] };
        gameListServiceSpy.deleteGame.and.returnValue(of(true));
        spyOn(component, 'refreshGameList');
        component.deleteGame(game);
        expect(component.refreshGameList).toHaveBeenCalled();
    });

    it('should show an error message when deleteGame fails', () => {
        const game: Game = { ...mockGames[0] };
        gameListServiceSpy.deleteGame.and.returnValue(of(false));
        spyOn(component, 'showErrorMessage');
        component.deleteGame(game);
        expect(gameListServiceSpy.deleteGame).toHaveBeenCalledWith(game);
        expect(component.showErrorMessage).toHaveBeenCalled();
    });

    it('should open the snack bar with the correct message and options', () => {
        component.showErrorMessage();
        expect(snackBarSpy.open).toHaveBeenCalledWith('Jeu déjà supprimé par un autre utilisateur', 'Fermer', { duration: 4000 });
    });
    it('should update games array when refreshGameList is called', () => {
        const mockGamesList: Game[] = [mockGames[0], mockGames[1]];
        gameListServiceSpy.getAllGames.and.returnValue(of(mockGamesList));
        component.refreshGameList();
        expect(gameListServiceSpy.getAllGames).toHaveBeenCalled();
        expect(component.games).toEqual(mockGamesList);
    });
});
