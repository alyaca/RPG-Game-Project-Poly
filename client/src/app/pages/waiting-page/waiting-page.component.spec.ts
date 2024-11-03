import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { mockGames } from '@app/mocks/mock-game';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { mockRoom } from '@app/mocks/mock-room';
import { GameCreationService } from '@app/services/game-creation/game-creation.service';
import { GameListService } from '@app/services/game-list/game-list.service';
import { MapEditorService } from '@app/services/map-editor/map-editor.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Game } from '@common/game';
import { BehaviorSubject, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { WaitingPageComponent } from './waiting-page.component';

describe('WaitingPageComponent', () => {
    let component: WaitingPageComponent;
    let fixture: ComponentFixture<WaitingPageComponent>;
    let gameListServiceSpy: jasmine.SpyObj<GameListService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let mapEditorServiceSpy: jasmine.SpyObj<MapEditorService>;
    let gameCreationServiceSpy: jasmine.SpyObj<GameCreationService>;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;
    let httpMock: HttpTestingController;

    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let accessCode: string;

    const activatedRouteSpy = {
        queryParams: of({ roomCode: '1234' }),
    };

    beforeEach(async () => {
        gameListServiceSpy = jasmine.createSpyObj('GameListService', ['chosenGameSubject']);
        gameListServiceSpy.chosenGameSubject = new BehaviorSubject<Game | null>(mockGames[0]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['joinRoom', 'getPlayerNumber']);
        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['on', 'send', 'off']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        mapEditorServiceSpy = jasmine.createSpyObj('MapEditorService', ['setMapToEdit']);
        gameCreationServiceSpy = jasmine.createSpyObj('GameCreationService', [
            'isModifiable',
            'setSelectedSize',
            'convertMapDimension',
            'loadedTiles',
            'loadedObjects',
            'loadedMapName',
        ]);
        accessCode = '1234';

        await TestBed.configureTestingModule({
            imports: [WaitingPageComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: GameListService, useValue: gameListServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: ActivatedRoute, useValue: activatedRouteSpy },
                { provide: MapEditorService, useValue: mapEditorServiceSpy },
                { provide: GameCreationService, useValue: gameCreationServiceSpy },
            ],
        }).compileComponents();

        httpMock = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(WaitingPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        component.players = mockLobbyPlayers;

        const request = httpMock.expectOne(`${environment.serverUrl}/chat?roomCode=${accessCode}`);
        request.flush([]);
    });

    afterEach(() => {
        httpMock.verify();
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
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'updatedPlayer') {
                    callback(mockRoom as T);
                }
            });
            component.ngOnInit();
            expect(component.players).toBe(mockRoom.listPlayers);
        });

        it('should set isAdmin to true is player admin', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'isPlayerAdmin') {
                    callback(true as T);
                }
            });
            component.ngOnInit();
            expect(component.isAdmin).toBe(true);
        });

        it('should call onPlayerKickedOut when receive kickPlayer event', () => {
            component.accessCode = accessCode;
            component.chosenGame = mockGames[0];
            const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
            dialogRefSpy.afterClosed.and.returnValue(of('close'));
            dialogSpy.open.and.returnValue(dialogRefSpy);

            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'kickPlayer') {
                    callback(event as T);
                }
            });
            component.ngOnInit();
            expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
                disableClose: true,
                data: { title: 'Vous avez été retiré du jeu' },
            });
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/join-game']);
        });

        it('should navigate to game-creation if player admin', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'leftRoom') {
                    callback(true as T);
                }
            });
            component.ngOnInit();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/game-creation']);
        });

        it('should navigate to home if player not admin', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'leftRoom') {
                    callback(false as T);
                }
            });
            component.ngOnInit();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
        });
    });

    it('should handle roomDeleted event and navigate to /home', () => {
        const message = 'Room has been deleted.';
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('close'));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        component.accessCode = accessCode;
        component.chosenGame = mockGames[0];
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
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

    it('should send leaveRoom event if leaveGame is called', () => {
        component.leaveGame(accessCode);
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('leaveRoom', accessCode);
    });

    describe('handleExit', () => {
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
                    options: ['Quitter', 'Rester'],
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
            dialogRefSpy.afterClosed.and.returnValue(of('left'));
            dialogSpy.open.and.returnValue(dialogRefSpy);
            component.handleExit(accessCode);

            expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
                disableClose: true,
                data: {
                    title: 'Abandonner la partie?',
                    messages: ["- Vous quitteriez la page d'attente"],
                    options: ['Quitter', 'Rester'],
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
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('changeLockRoom', true);
    });

    it('should navigate to /game-page when dialog result is "Confirmer"', () => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('right'));
        dialogSpy.open.and.returnValue(dialogRefSpy);
        component.isLocked = true;
        component.handleStartGame();

        expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Débuter la partie',
                messages: ['Êtes-vous certains de vouloir débuter la partie?'],
                options: ['Annuler', 'Confirmer'],
                confirm: true,
            },
        });
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('startGame');
    });

    it('should not navigate when the dialog is cancelled', () => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('left'));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        component.handleStartGame();

        expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should open the dialog and not navigate when only 1 player', () => {
        component.players = [];
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('close'));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        component.handleStartGame();
        expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Débuter la partie',
                messages: ['Il faut au moins 2 joueurs pour commencer la partie'],
                options: ['Fermer'],
                confirm: false,
            },
        });
    });

    it('should open the dialog when the room is not locked', () => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('right'));
        dialogSpy.open.and.returnValue(dialogRefSpy);
        component.handleStartGame();

        expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Débuter la partie',
                messages: ['Il faut verrouiller la salle afin de commencer la partie'],
                options: ['Fermer'],
                confirm: false,
            },
        });
    });

    it('should call loadMap and set the chosenGame when startGame is received', () => {
        spyOn(component, 'loadMap');
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'startGame') {
                callback(mockRoom as unknown as T);
            }
        });
        component.ngOnInit();
        expect(component.chosenGame).toEqual(mockRoom.gameMap);
        expect(component.loadMap).toHaveBeenCalled();
    });

    it('should do everything in loadMap correctly', () => {
        gameCreationServiceSpy.isModifiable = true;
        gameCreationServiceSpy.isNewGame = true;
        component.chosenGame = mockGames[0];
        component.loadMap();

        expect(gameCreationServiceSpy.isModifiable).toBeFalse();
        expect(gameCreationServiceSpy.isNewGame).toBeFalse();
        expect(mapEditorServiceSpy.setMapToEdit).toHaveBeenCalled();
        expect(gameCreationServiceSpy.setSelectedSize).toHaveBeenCalled();
        expect(gameCreationServiceSpy.convertMapDimension).toHaveBeenCalled();
        expect(gameCreationServiceSpy.loadedTiles).toEqual(component.chosenGame.tiles);
        expect(gameCreationServiceSpy.loadedObjects).toEqual(component.chosenGame.itemPlacement);
        expect(gameCreationServiceSpy.loadedMapName).toEqual(component.chosenGame.name);
    });
});
