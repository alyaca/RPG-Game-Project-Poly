import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ACCESS_CODE_LENGTH,
    MAX_ACCESS_CODE_VALUE,
    MAX_PLAYER_SIZE_INT,
    THREE_PLAYERS_LOBBY,
    FOUR_PLAYERS_LOBBY,
    FIVE_PLAYERS_LOBBY,
} from '@app/constants';
import { Map } from '@app/interfaces/map';
import { mockGames } from '@app/mocks/mock-game';
import { GameListService } from '@app/services/game-list.service';
import { BehaviorSubject, of } from 'rxjs';
import { WaitingPageComponent } from './waiting-page.component';
import { PlayerSize } from '@app/interfaces/lobbyPlayer';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { MatDialog } from '@angular/material/dialog';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    beforeEach(async () => {
        gameListServiceSpy = jasmine.createSpyObj('GameListService', ['chosenGameSubject']);
        gameListServiceSpy.chosenGameSubject = new BehaviorSubject<Map | null>(mockGames[0]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

        await TestBed.configureTestingModule({
            imports: [WaitingPageComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        params: of({}),
                        snapshot: { paramMap: { get: () => null } },
                    },
                },
                {
                    provide: GameListService,
                    useValue: gameListServiceSpy,
                },
                {
                    provide: Router,
                    useValue: routerSpy,
                },
                {
                    provide: MatDialog,
                    useValue: dialogSpy,
                },
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

    it('should navigate to /game-creation if no game is selected', () => {
        gameListServiceSpy.chosenGameSubject.next(null);
        component.ngOnInit();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/game-creation']);
    });

    it('should set chosenGame when a game is selected', () => {
        const mockGame: Map = mockGames[0];
        gameListServiceSpy.chosenGameSubject.next(mockGame);
        fixture.detectChanges();
        expect(component.chosenGame).toEqual(mockGame);
    });

    it('should generate an access code on initialization', () => {
        component.ngOnInit();
        expect(component.accessCode).toBeTruthy();
    });

    it('should generate a 4-digit access code', () => {
        component.ngOnInit();
        expect(component.accessCode.length).toBe(ACCESS_CODE_LENGTH);
    });

    it('should pad access code with zeroes if necessary', () => {
        const mockRandom = 23;
        spyOn(Math, 'random').and.returnValue(mockRandom / component.maxRandom);

        component.ngOnInit();

        expect(component.accessCode).toBe('0023');
    });

    it('should generate an access code between 0000 and 9999', () => {
        for (let i = 0; i < MAX_ACCESS_CODE_VALUE; i++) {
            component.ngOnInit();
            const codeNumber = parseInt(component.accessCode, 10);
            expect(codeNumber).toBeGreaterThanOrEqual(0);
            expect(codeNumber).toBeLessThan(MAX_ACCESS_CODE_VALUE);
        }
    });

    it('should assign correct player sizes for 1 player', () => {
        component.players = mockLobbyPlayers.slice(0, 1);
        component.attributeSizeDynamically();
        expect(component.players[0].size).toBe(PlayerSize.Big);
    });

    it('should assign correct player sizes for 2 players', () => {
        component.players = mockLobbyPlayers.slice(0, 2);
        component.attributeSizeDynamically();
        expect(component.players.map((p) => p.size)).toEqual([PlayerSize.Big, PlayerSize.Big]);
    });

    it('should assign correct player sizes for 3 players', () => {
        component.players = mockLobbyPlayers.slice(0, THREE_PLAYERS_LOBBY);
        component.attributeSizeDynamically();
        expect(component.players.map((p) => p.size)).toEqual([PlayerSize.Medium, PlayerSize.Big, PlayerSize.Medium]);
    });

    it('should assign correct player sizes for 4 players', () => {
        component.players = mockLobbyPlayers.slice(0, FOUR_PLAYERS_LOBBY);
        component.attributeSizeDynamically();
        expect(component.players.map((p) => p.size)).toEqual([PlayerSize.Medium, PlayerSize.Big, PlayerSize.Big, PlayerSize.Medium]);
    });

    it('should assign correct player sizes for 5 players', () => {
        component.players = mockLobbyPlayers.slice(0, FIVE_PLAYERS_LOBBY);
        component.attributeSizeDynamically();
        expect(component.players.map((p) => p.size)).toEqual([
            PlayerSize.Small,
            PlayerSize.Medium,
            PlayerSize.Big,
            PlayerSize.Medium,
            PlayerSize.Small,
        ]);
    });

    it('should assign correct player sizes for 6 players', () => {
        component.players = mockLobbyPlayers;
        component.attributeSizeDynamically();
        expect(component.players.map((p) => p.size)).toEqual([
            PlayerSize.Small,
            PlayerSize.Medium,
            PlayerSize.Big,
            PlayerSize.Big,
            PlayerSize.Medium,
            PlayerSize.Small,
        ]);
    });

    it('should return correct player size based on value', () => {
        expect(component.getPlayerSize(2)).toBe(PlayerSize.Big);
        expect(component.getPlayerSize(1)).toBe(PlayerSize.Medium);
        expect(component.getPlayerSize(0)).toBe(PlayerSize.Small);
    });

    it('should return correct player size for maximum value', () => {
        expect(component.getPlayerSize(MAX_PLAYER_SIZE_INT)).toBe(PlayerSize.Big);
    });

    it('should open the dialog and navigate to /home if confirmed', () => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('left'));
        dialogSpy.open.and.returnValue(dialogRefSpy);
        component.handleExit();

        expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Abandonner la partie?',
                messages: ["- Vous quitteriez la page d'attente"],
                confirm: true,
            },
        });

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should not navigate if dialog result is not left', () => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('stay'));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        component.handleExit();

        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
});
