import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { MAX_PLAYER_SIZE_INT } from '@app/constants';
import { PlayerSize } from '@app/interfaces/lobbyPlayer';
import { mockGames } from '@app/mocks/mock-game';
import { mockRoom } from '@app/mocks/mock-room';
import { GameListService } from '@app/services/game-list.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';
import { Game } from '@common/game';
import { BehaviorSubject, of } from 'rxjs';
import { WaitingPageComponent } from './waiting-page.component';

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let playerConnectionServiceSpy: jasmine.SpyObj<PlayerConnectionService>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let accessCode: string;

    beforeEach(async () => {
        gameListServiceSpy = jasmine.createSpyObj('GameListService', ['chosenGameSubject']);
        gameListServiceSpy.chosenGameSubject = new BehaviorSubject<Game | null>(mockGames[0]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['joinRoom']);
        playerConnectionServiceSpy = jasmine.createSpyObj('PlayerConnectionService', ['on', 'send']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        accessCode = '1234';

        await TestBed.configureTestingModule({
            imports: [WaitingPageComponent],
            providers: [
                { provide: GameListService, useValue: gameListServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: PlayerConnectionService, useValue: playerConnectionServiceSpy },
                { provide: MatDialog, useValue: dialogSpy },
            ],
        }).compileComponents();

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

    describe('ngOnInit', () => {
        it('should navigate to /home if no game is selected (refresh page)', () => {
            gameListServiceSpy.chosenGameSubject.next(null);
            component.ngOnInit();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
        });

        it('should navigate to /home if no game is received', () => {
            component.accessCode = accessCode;
            component.ngOnInit();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
        });

        it('should navigate to /home if no room is created', () => {
            component.ngOnInit();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
        });

        it('should set chosenGame when a game is selected', () => {
            const mockGame: Game = mockGames[0];
            gameListServiceSpy.chosenGameSubject.next(mockGame);
            fixture.detectChanges();
            expect(component.chosenGame).toEqual(mockGame);
        });

        it('should set player list when it is updated', () => {
            playerConnectionServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'udaptedPlayer') {
                    callback(mockRoom as T);
                }
            });
            component.ngOnInit();
            expect(component.players).toBe(mockRoom.listPlayers);
        });
    });

    it('should handle roomDeleted event and navigate to /home', () => {
        const message = 'Room has been deleted.';
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('close'));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        component.accessCode = accessCode;
        component.chosenGame = mockGames[0];
        playerConnectionServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'roomDeleted') {
                callback('Room has been deleted.' as unknown as T);
            }
        });
        component.ngOnInit();

        expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
            disableClose: true,
            data: { title: 'Partie annulée', messages: [message] },
        });
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should call leaveRoom and navigate to home if normal player on leftRoom event', () => {
        const expectedRoute = '/home';
        playerConnectionServiceSpy.on.and.callFake(<T>(event: string, callback: (isAdmin: T) => void) => {
            if (event === 'leftRoom') {
                callback(false as unknown as T);
            }
        });
        component.leaveGame(accessCode);

        expect(playerConnectionServiceSpy.send).toHaveBeenCalledWith('leaveRoom', accessCode);
        expect(routerSpy.navigate).toHaveBeenCalledWith([expectedRoute]);
    });

    it('should call leaveRoom and navigate to game creation if admin player on leftRoom event', () => {
        const expectedRoute = '/game-creation';
        playerConnectionServiceSpy.on.and.callFake(<T>(event: string, callback: (isAdmin: T) => void) => {
            if (event === 'leftRoom') {
                callback(true as unknown as T);
            }
        });
        component.leaveGame(accessCode);

        expect(playerConnectionServiceSpy.send).toHaveBeenCalledWith('leaveRoom', accessCode);
        expect(routerSpy.navigate).toHaveBeenCalledWith([expectedRoute]);
    });

    describe('Player size', () => {
        it('should return correct player size based on value', () => {
            expect(component.getPlayerSize(2)).toBe(PlayerSize.Big);
            expect(component.getPlayerSize(1)).toBe(PlayerSize.Medium);
            expect(component.getPlayerSize(0)).toBe(PlayerSize.Small);
        });

        it('should return correct player size for maximum value', () => {
            expect(component.getPlayerSize(MAX_PLAYER_SIZE_INT)).toBe(PlayerSize.Big);
        });
    });

    describe('handeExit', () => {
        it('should open the dialog and navigate to /home if confirmed', () => {
            const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
            dialogRefSpy.afterClosed.and.returnValue(of('leave'));
            dialogSpy.open.and.returnValue(dialogRefSpy);
            component.handleExit(accessCode);

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

        it('should not call leaveGame if dialog result is not leave', () => {
            const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
            spyOn(component, 'leaveGame');
            dialogRefSpy.afterClosed.and.returnValue(of('stay'));
            dialogSpy.open.and.returnValue(dialogRefSpy);

            component.handleExit(accessCode);

            expect(component.leaveGame).not.toHaveBeenCalledWith(accessCode);
        });

        it('should open the dialog and call leaveGame if dialog result is leave', () => {
            const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
            spyOn(component, 'leaveGame');
            dialogRefSpy.afterClosed.and.returnValue(of('leave'));
            dialogSpy.open.and.returnValue(dialogRefSpy);
            component.handleExit(accessCode);

            expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
                disableClose: true,
                data: {
                    title: 'Abandonner la partie?',
                    messages: ["- Vous quitteriez la page d'attente"],
                    confirm: true,
                },
            });
            expect(component.leaveGame).toHaveBeenCalledWith(accessCode);
        });
    });

    it('should update gameService isRoomLocked and send event', () => {
        component.isLocked = true;
        component.onLockChange();

        expect(gameServiceSpy.isRoomLocked).toBe(true);
        expect(playerConnectionServiceSpy.send).toHaveBeenCalledWith('changeLockRoom', { isLocked: true });
    });
});
