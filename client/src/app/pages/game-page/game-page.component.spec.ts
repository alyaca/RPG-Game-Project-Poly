import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ElementRef, QueryList } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { DialogMessages, DialogOptions, DialogResult, DialogTitle, STARTING_TIME, TURN_TIME, WARNING_TIME } from '@app/constants';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { mockPlayer } from '@app/mocks/mock-player';
import { mockPlayers } from '@app/mocks/mock-players';
import { mockRoom } from '@app/mocks/mock-room';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let timerSpy: jasmine.SpyObj<TimerComponent>;
    let fixture: ComponentFixture<GamePageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let chatBoxSpy: jasmine.SpyObj<ChatBoxComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SimpleDialogComponent>>;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;
    let httpMock: HttpTestingController;
    let mockSocket: Socket;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let navigationServiceSpy: jasmine.SpyObj<NavigationService>;

    const accessCode = '1234';

    beforeEach(async () => {
        chatBoxSpy = jasmine.createSpyObj(ChatBoxComponent, ['unsubscribe', 'subscribe']);
        timerSpy = jasmine.createSpyObj(TimerComponent, ['pauseTimer', 'resumeTimer']);
        socketCommunicationServiceSpy = jasmine.createSpyObj(SocketCommunicationService, ['on', 'send', 'isSocketAlive', 'connect', 'disconnect']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        dialogRefSpy = jasmine.createSpyObj('SimpleDialogComponent', ['open', 'afterClosed', 'close']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        dialogRefSpy.afterClosed.and.returnValue(of('left'));
        dialogSpy.open.and.returnValue(dialogRefSpy);
        mockSocket = { data: { roomCode: '1234' }, id: 'player' } as unknown as Socket;
        gameServiceSpy = jasmine.createSpyObj('GameService', ['openDialog', 'hasActionPoints']);
        navigationServiceSpy = jasmine.createSpyObj('NavigationService', ['checkDoor', 'checkAttack']);

        await TestBed.configureTestingModule({
            imports: [GamePageComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: ChatBoxComponent, useValue: chatBoxSpy },
                { provide: TimerComponent, useValue: timerSpy },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: { queryParams: of({ roomCode: '1234' }) } },
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: NavigationService, useValue: navigationServiceSpy },
            ],
        }).compileComponents();

        socketCommunicationServiceSpy.socket = mockSocket;
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'mapInformation') {
                callback(mockRoom as T);
            }
        });

        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'isActive') {
                callback(mockPlayer.id as T);
            }
        });

        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'beforeStartTurnTimer') {
                callback(WARNING_TIME as T);
            }
        });

        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'turnEnded') {
                callback(mockPlayers as T);
            }
        });

        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'startedTurnTimer') {
                callback(TURN_TIME as T);
            }
        });

        httpMock = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        component.allPlayers = mockPlayers;
        fixture.detectChanges();

        const request = httpMock.expectOne(`${environment.serverUrl}/chat?roomCode=${accessCode}`);
        request.flush([]);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should set players and health on mapInformation event', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'mapInformation') {
                    callback(mockRoom as T);
                }
            });
            spyOn(component, 'replenishHealth');
            component.ngOnInit();
            expect(component.allPlayers).toEqual(mockRoom.listPlayers);
            expect(component.replenishHealth).toHaveBeenCalled();
        });

        it('should set players on mapInformation event', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'disconnectedPlayer') {
                    callback(mockLobbyPlayers as T);
                }
            });
            component.ngOnInit();
            expect(component.allPlayers).toEqual(mockLobbyPlayers);
        });

        it('should disconnect on draw event', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'draw') {
                    callback({} as T);
                }
            });
            spyOn(component, 'handleDraw');
            component.ngOnInit();
            expect(component.handleDraw).toHaveBeenCalled();
        });
        it('should set active player name on otherPlayerTurn event', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'otherPlayerTurn') {
                    callback(mockPlayer.name as T);
                }
            });
            component.ngOnInit();
            expect(component.activePlayerName).toEqual(mockPlayer.name);
        });
        it('should disconnect on draw event', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'playerFell') {
                    callback({} as T);
                }
            });
            spyOn(component, 'onPlayerFell');
            component.ngOnInit();
            expect(component.onPlayerFell).toHaveBeenCalled();
        });
    });

    it('should set isActivePlayer and isTurnStartShowed when isActive event is emitted', () => {
        mockSocket.id = '0';
        navigationServiceSpy.players = JSON.parse(JSON.stringify(mockPlayers));
        socketCommunicationServiceSpy.socket.id = mockPlayers[0].id;
        spyOn(component, 'timerEvents');
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'isActive') {
                callback(mockPlayers[0].id as T);
            }
        });
        component.ngAfterViewInit();
        expect(component.isActivePlayer).toBeTrue();
        expect(component.isTurnStartShowed).toBeTrue();
        expect(component.timerEvents).toHaveBeenCalled();
    });

    it('should toggle isActionDoorSelected correctly', () => {
        const initialActionSelected = gameServiceSpy.isActionDoorSelected;
        component.toggleActionDoorSelected();
        expect(gameServiceSpy.isActionDoorSelected).toBe(!initialActionSelected);
        expect(gameServiceSpy.isActionCombatSelected).toBe(false);
    });

    it('should toggle isActionCombatSelected correctly', () => {
        const initialActionSelected = gameServiceSpy.isActionCombatSelected;
        component.toggleActionCombatSelected();
        expect(gameServiceSpy.isActionCombatSelected).toBe(!initialActionSelected);
        expect(gameServiceSpy.isActionDoorSelected).toBe(false);
    });

    it('should set the id of the first pageDiv element to "enabled"', () => {
        const mockDivs = new QueryList<ElementRef<HTMLDivElement>>();
        const elementRef = new ElementRef(document.createElement('div'));
        mockDivs.reset([elementRef]);
        component.pageDiv = mockDivs;
        component.enableClicks();
        expect(component.pageDiv.first.nativeElement.id).toBe('enabled');
    });

    it('should not navigate to home if the dialog is right', () => {
        gameServiceSpy.openDialog.and.returnValue(of(DialogResult.Right));

        component.handleExit();
        expect(gameServiceSpy.openDialog).toHaveBeenCalledWith({
            title: DialogTitle.QuitGame,
            messages: [DialogMessages.QuitGame],
            options: [DialogOptions.Quit, DialogOptions.Stay],
            confirm: true,
        });
    });

    it('should navigate to /home if the dialog result is Left', () => {
        gameServiceSpy.openDialog.and.returnValue(of(DialogResult.Left));
        component.handleExit();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should replenish health for all players', () => {
        const player = mockPlayer;
        expect(player.attributes.currentHp).not.toEqual(player.attributes.totalHp);
        component.replenishHealth();
        component.allPlayers.forEach((player) => {
            expect(player.attributes.currentHp).toEqual(player.attributes.totalHp);
        });
    });

    it('should call openDialog with the correct parameters for handleDraw', () => {
        gameServiceSpy.openDialog.and.returnValue(of(DialogResult.Close));
        component.handleDraw();
        expect(gameServiceSpy.openDialog).toHaveBeenCalledWith({
            title: DialogTitle.DrawGame,
            messages: [DialogMessages.DrawGame],
            options: [DialogOptions.Close],
            confirm: false,
        });
    });

    it('should disconnect and navigate to home when dialog result is "Close" for handleDraw', () => {
        gameServiceSpy.openDialog.and.returnValue(of(DialogResult.Close));
        component.handleDraw();
        expect(socketCommunicationServiceSpy.disconnect).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should call socketCommunicationService.send with "endTurn" for onEndTurn', () => {
        component.onEndTurn();
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('endTurn');
    });

    it('should return true if checkDoor returns true', () => {
        navigationServiceSpy.checkDoor.and.returnValue(mockPlayers[0].position);
        const result = component.checkDoors();
        expect(result).toBeTrue();
    });

    it('should return false when checkDoor returns an invalid Position', () => {
        navigationServiceSpy.checkDoor.and.returnValue(undefined);
        const result = component.checkDoors();
        expect(result).toBeFalse();
    });

    it('should return true if checkAttack returns true', () => {
        navigationServiceSpy.checkAttack.and.returnValue(mockPlayers[0]);
        const result = component.checkAttack();
        expect(result).toBeTrue();
    });

    it('should return false if checkAttack returns false', () => {
        navigationServiceSpy.checkAttack.and.returnValue(undefined);
        const result = component.checkAttack();
        expect(result).toBeFalse();
    });

    it('should return the correct player count when allPlayers is defined and has players', () => {
        component.allPlayers = mockPlayers;
        const result = component.getPlayerCount();
        expect(result).toBe(mockPlayers.length);
    });

    it('should return 0 when there are no players', () => {
        component.allPlayers = [];
        const result = component.getPlayerCount();
        expect(result).toBe(0);
    });

    it('should reset action selections before start of turn and send startTurn', () => {
        component.activePlayer = mockPlayers[0];
        gameServiceSpy.isActionCombatSelected = true;
        gameServiceSpy.isActionDoorSelected = true;
        component.onBeforeStartTurn();
        expect(gameServiceSpy.isActionCombatSelected).toBeFalse();
        expect(gameServiceSpy.isActionDoorSelected).toBeFalse();
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('startTurn');
    });

    it('should call gameService.openDialog with the correct parameters for onPlayerFell', () => {
        const endTurnSpy = spyOn(component, 'onEndTurn');
        gameServiceSpy.openDialog.and.returnValue(of(DialogResult.Close));
        component.onPlayerFell();
        expect(gameServiceSpy.openDialog).toHaveBeenCalledWith({
            title: DialogTitle.EndTurn,
            messages: [DialogMessages.Fell],
            confirm: false,
            options: [DialogOptions.Close],
        });
        expect(endTurnSpy).toHaveBeenCalled();
    });

    it('should update timeRemainingBeforeStartTurn when beforeStartTurnTimer event is emitted', () => {
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'beforeStartTurnTimer') {
                callback(STARTING_TIME as T);
            }
        });
        component.timerEvents();
        expect(component.timeRemainingBeforeStartTurn).toBe(STARTING_TIME);
    });

    it('should update allPlayers and call onBeforeStartTurn when turnEnded event is emitted', () => {
        spyOn(component, 'onBeforeStartTurn');
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'turnEnded') {
                callback(mockPlayers as T);
            }
        });
        component.timerEvents();
        expect(component.allPlayers).toBe(mockPlayers);
        expect(component.onBeforeStartTurn).toHaveBeenCalled();
    });

    it('should call hasActionsPoint of gameService', () => {
        gameServiceSpy.hasActionPoints.and.returnValue(true);
        const result = component.hasActionPoints();
        expect(result).toBe(true);
    });
});
