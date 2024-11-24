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
        socketCommunicationServiceSpy = jasmine.createSpyObj(SocketCommunicationService, [
            'on',
            'once',
            'send',
            'isSocketAlive',
            'connect',
            'disconnect',
        ]);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        dialogRefSpy = jasmine.createSpyObj('SimpleDialogComponent', ['open', 'afterClosed', 'close']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        dialogRefSpy.afterClosed.and.returnValue(of({ action: 'left' }));
        dialogSpy.open.and.returnValue(dialogRefSpy);
        mockSocket = { data: { roomCode: '1234' }, id: 'player' } as unknown as Socket;
        gameServiceSpy = jasmine.createSpyObj('GameService', ['openDialog', 'hasActionPoints']);
        navigationServiceSpy = jasmine.createSpyObj('NavigationService', ['checkDoor', 'checkAttack', 'isOnWall']);

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

        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'debugMode') {
                callback(true as T);
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
            component.activePlayer = mockLobbyPlayers[0];
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

        it('should update dubugMode on debugMode event', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'debugMode') {
                    callback(true as T);
                }
            });
            component.ngOnInit();
            expect(navigationServiceSpy.isDebugMode).toBeTrue();
        });
    });

    it('should set isActivePlayer and isTurnStartShowed when isActive event is emitted', () => {
        mockSocket.id = '0';
        navigationServiceSpy.players = JSON.parse(JSON.stringify(mockPlayers));
        socketCommunicationServiceSpy.socket.id = mockPlayers[0].id;
        spyOn(component, 'timerEvents');
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'isActive') {
                callback(mockPlayers[0] as T);
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
        gameServiceSpy.openDialog.and.returnValue(of({ action: DialogResult.Right }));

        component.handleExit();
        expect(gameServiceSpy.openDialog).toHaveBeenCalledWith({
            title: DialogTitle.QuitGame,
            messages: [DialogMessages.QuitGame],
            options: [DialogOptions.Quit, DialogOptions.Stay],
            confirm: true,
            itemSwap: null,
        });
    });

    it('should send debugMode event when admin leaves the game', () => {
        spyOn(component, 'isPlayerAdmin').and.returnValue(true);
        gameServiceSpy.openDialog.and.returnValue(of({ action: DialogResult.Left }));

        component.handleExit();
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('debugMode', false);
    });

    it('should navigate to /home if the dialog result is Left', () => {
        gameServiceSpy.openDialog.and.returnValue(of({ action: DialogResult.Left }));
        component.handleExit();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should replenish health for all players', () => {
        expect(mockPlayer.attributes.currentHp).not.toEqual(mockPlayer.attributes.totalHp);
        component.replenishHealth();
        component.allPlayers.forEach((player) => {
            expect(player.attributes.currentHp).toEqual(player.attributes.totalHp);
        });
    });

    it('should call openDialog with the correct parameters for handleDraw', () => {
        gameServiceSpy.openDialog.and.returnValue(of({ action: DialogResult.Close }));
        component.handleDraw();
        expect(gameServiceSpy.openDialog).toHaveBeenCalledWith({
            title: DialogTitle.DrawGame,
            messages: [DialogMessages.DrawGame],
            options: [DialogOptions.Close],
            confirm: false,
            itemSwap: null,
        });
    });

    it('should disconnect and navigate to home when dialog result is "Close" for handleDraw', () => {
        gameServiceSpy.openDialog.and.returnValue(of({ action: DialogResult.Close }));
        component.handleDraw();
        expect(socketCommunicationServiceSpy.disconnect).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should call socketCommunicationService.send with "endTurn" for onEndTurn', () => {
        component.activePlayer = mockPlayers[0];
        component.onEndTurn();
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('endTurn');
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
        gameServiceSpy.openDialog.and.returnValue(of({ action: DialogResult.Close }));
        component.onPlayerFell();
        expect(gameServiceSpy.openDialog).toHaveBeenCalledWith({
            title: DialogTitle.EndTurn,
            messages: [DialogMessages.Fell],
            confirm: false,
            options: [DialogOptions.Close],
            itemSwap: null,
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

    it('should send event debugMode when admin presses d on keyboard', () => {
        navigationServiceSpy.isDebugMode = false;
        spyOn(component, 'isPlayerAdmin').and.returnValue(true);
        const event = new KeyboardEvent('keydown', { key: 'd' });
        document.dispatchEvent(event);
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('debugMode', true);
    });

    it('should not send event debugMode when player presses d on keyboard', () => {
        navigationServiceSpy.isDebugMode = false;
        spyOn(component, 'isPlayerAdmin').and.returnValue(false);
        const event = new KeyboardEvent('keydown', { key: 'd' });
        document.dispatchEvent(event);
        expect(socketCommunicationServiceSpy.send).not.toHaveBeenCalled();
    });

    it('should call enableClicks when closeTurnStartPopUp is called', () => {
        spyOn(component, 'enableClicks');
        component.closeTurnStartPopUp();
        expect(component.enableClicks).toHaveBeenCalled();
    });

    it('should call closeTurnStartPopUp and update timeRemainingStartTurn when startedTurnTimer event is emitted', () => {
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'startedTurnTimer') {
                callback(TURN_TIME as T);
            }
        });
        spyOn(component, 'closeTurnStartPopUp');
        component.timerEvents();
        expect(component.timeRemainingStartTurn).toBe(TURN_TIME);
    });
});
