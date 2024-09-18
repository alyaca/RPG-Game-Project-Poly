import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Game } from '@app/interfaces/game';
import { Map } from '@app/interfaces/map';
import { mockGames } from '@app/mocks/mock-game';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { GameListService } from './game-list.service';

describe('GameListService', () => {
    let httpMock: HttpTestingController;
    let service: GameListService;
    const apiUrl: string = `${environment.serverUrl}/maps/visible`;
    let selectedGameSubject: BehaviorSubject<Game | null>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
        });
        service = TestBed.inject(GameListService);
        httpMock = TestBed.inject(HttpTestingController);
        selectedGameSubject = service['selectedGameSubject'];
        
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should get all visible maps and transform dimension', () => {
        const mockMaps: Map[] = [
            {
                _id: 'abcdefg',
                name: 'Map1',
                description: 'Description1',
                visible: true,
                mode: 'CTF',
                nbPlayers: 6,
                image: 'img1',
                tiles: [0, 1],
                dimension: 20,
                itemPlacement: [0, 1],
                isSelected: false,
                lastModification: new Date(),
            },
        ];



        service.getAllVisibleMaps().subscribe((maps) => {
            expect(maps.length).toBeGreaterThan(0);
            expect(maps[0].dimension).toBe('20x20');
        });

        const req = httpMock.expectOne(apiUrl);
        expect(req.request.method).toBe('GET');
        req.flush(mockMaps);
    });

    it('should deselect all games and select a new game', () => {
        const gameToSelect: Game = mockGames[0]; 

        spyOn(service, 'deselectGame').and.callThrough();

        service.selectGame(gameToSelect, mockGames);

        expect(service.deselectGame).toHaveBeenCalledWith(mockGames);

        expect(gameToSelect.isSelected).toBeTrue();

        selectedGameSubject.subscribe((selectedGame) => {
            expect(selectedGame).toEqual(gameToSelect);
        });

        mockGames.forEach((game) => {
            if (game._id !== gameToSelect._id) {
                expect(game.isSelected).toBeFalse();
            }
        });
    });

    it('should deselect all games', () => {
        service.deselectGame(mockGames);

        mockGames.forEach((game) => {
            expect(game.isSelected).toBeFalse();
        });

        selectedGameSubject.subscribe((selectedGame) => {
            expect(selectedGame).toBeNull();
        });
    });
});
