import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { GameListComponent } from '@app/components/game-list/game-list.component';
import { Map } from '@app/interfaces/map';
import { mockGames } from '@app/mocks/mock-game';
import { GameListService } from '@app/services/game-list.service';
import { BehaviorSubject, of } from 'rxjs';
import { CreateGamePageComponent } from './create-game-page.component';

describe('CreateGamePageComponent', () => {
    let component: CreateGamePageComponent;
    let fixture: ComponentFixture<CreateGamePageComponent>;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
    let activatedRouteSpy: jasmine.SpyObj<ActivatedRoute>;
    let selectedGameSubject: BehaviorSubject<Map | null>;
    let chosenGameSubject: BehaviorSubject<Map | null>;
    let mockMap: Map;

    beforeEach(async () => {
        mockMap = {
            _id: 'abcdefg',
            name: 'Map1',
            description: 'Description1',
            visible: true,
            mode: 'CTF',
            nbPlayers: 6,
            image: 'img1',
            tiles: [
                [0, 1],
                [0, 1],
            ],
            dimension: 20,
            itemPlacement: [
                [0, 1],
                [0, 1],
            ],
            isSelected: false,
            lastModification: new Date(),
        };
        gameListServiceSpy = jasmine.createSpyObj('GameListService', [
            'getAllVisibleGames',
            'selectGame',
            'deselectGame',
            'getGames',
            'checkIfVisibleGameExists',
        ]);
        selectedGameSubject = new BehaviorSubject<Map | null>(null);
        chosenGameSubject = new BehaviorSubject<Map | null>(null);
        Object.defineProperty(gameListServiceSpy, 'selectedGameSubject', { value: selectedGameSubject });
        Object.defineProperty(gameListServiceSpy, 'chosenGameSubject', { value: chosenGameSubject });

        gameListServiceSpy.getAllVisibleGames.and.returnValue(of(mockGames));
        snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

        gameListServiceSpy.selectGame.and.callFake((game: Map) => {
            game.isSelected = true;
        });
        gameListServiceSpy.deselectGame.and.callFake((games: Map[]) => {
            games.forEach((game) => (game.isSelected = false));
        });
        gameListServiceSpy.getGames.and.returnValue(of(mockGames));

        await TestBed.configureTestingModule({
            imports: [CreateGamePageComponent, GameListComponent],
            providers: [
                { provide: GameListService, useValue: gameListServiceSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: MatSnackBar, useValue: snackBarSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        gameListServiceSpy.selectedGameSubject.next(null);
        gameListServiceSpy.chosenGameSubject.next(null);
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should set isCharacterFormVisible to true when showCharacterForm is called and the visible game exist', () => {
        gameListServiceSpy.selectedGameSubject.next(mockMap);
        gameListServiceSpy.chosenGameSubject.next(mockMap);
        gameListServiceSpy.checkIfVisibleGameExists.and.returnValue(of(mockMap));

        component.showCharacterForm();

        expect(component.isCharacterFormVisible).toBeTrue();
        expect(snackBarSpy.open).not.toHaveBeenCalled();
    });

    it('should show snack bar if no game is selected', () => {
        component.showCharacterForm();

        expect(snackBarSpy.open).toHaveBeenCalledWith('Veuillez sélectionner un jeu avant de créer la partie', 'Fermer', {
            duration: 2000,
        });
        expect(component.isCharacterFormVisible).toBeFalse();
    });

    it('should set isCharacterFormVisible to false when hideCharacterForm is called', () => {
        component.hideCharacterForm();
        expect(component.isCharacterFormVisible).toBeFalse();
    });

    it('should show snack bar if selected game does not exist', () => {
        selectedGameSubject.next(mockMap);

        gameListServiceSpy.checkIfVisibleGameExists.and.returnValue(of(null));

        component.showCharacterForm();

        expect(snackBarSpy.open).toHaveBeenCalledWith("Le jeu sélectionné n'existe pas ou a été caché", 'Fermer', {
            duration: 2000,
        });
        expect(component.isCharacterFormVisible).toBeFalse();
    });
});
