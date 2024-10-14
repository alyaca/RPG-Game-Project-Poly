import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { mockGames } from '@app/mocks/mock-game';
import { GameListService } from '@app/services/game-list.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';
import { Game } from '@common/game';
import { BehaviorSubject } from 'rxjs';
import { WaitingPageComponent } from './waiting-page.component';

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let playerConnectionServiceSpy: jasmine.SpyObj<PlayerConnectionService>;

    beforeEach(async () => {
        gameListServiceSpy = jasmine.createSpyObj('GameListService', ['chosenGameSubject']);
        gameListServiceSpy.chosenGameSubject = new BehaviorSubject<Game | null>(mockGames[0]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['joinRoom']);
        playerConnectionServiceSpy = jasmine.createSpyObj('PlayerConnectionService', ['on', 'send']);
        await TestBed.configureTestingModule({
            imports: [WaitingPageComponent],
            providers: [
                { provide: GameListService, useValue: gameListServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: PlayerConnectionService, useValue: playerConnectionServiceSpy },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterAll(() => {
        gameListServiceSpy.chosenGameSubject.complete();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to /game-creation if no game is selected in admin', () => {
        gameListServiceSpy.chosenGameSubject.next(null);
        component.ngOnInit();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/game-creation']);
    });

    it('should navigate to /game-creation if no game is received', () => {
        component.accessCode = '1234';
        component.ngOnInit();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/game-creation']);
    });

    it('should navigate to /game-creation if no room is created', () => {
        component.ngOnInit();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/game-creation']);
    });

    it('should set chosenGame when a game is selected', () => {
        const mockGame: Game = mockGames[0];
        gameListServiceSpy.chosenGameSubject.next(mockGame);
        fixture.detectChanges();
        expect(component.chosenGame).toEqual(mockGame);
    });

    it('should handle roomDeleted event and navigate to /home', () => {
        component.accessCode = '1234';
        component.chosenGame = mockGames[0];

        playerConnectionServiceSpy.on.and.callFake((event: string, callback: (data: any) => void) => {
            if (event === 'roomDeleted') {
                callback('Room has been deleted.');
            }
        });
        component.ngOnInit();

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should send "leaveRoom" event and navigate to /create-game', () => {
        const roomCode = '1234';
        component.leaveGame(roomCode);

        expect(playerConnectionServiceSpy.send).toHaveBeenCalledWith('leaveRoom', roomCode);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
    });
});
