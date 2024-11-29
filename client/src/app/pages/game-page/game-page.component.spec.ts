import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { ATTACK_TIME } from '@app/constants';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { mockPlayer } from '@app/mocks/mock-player';
import { mockPlayers } from '@app/mocks/mock-players';
import { mockRoom } from '@app/mocks/mock-room';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { CombatService } from '@app/services/sockets/combat/combat.service';
import { GameService } from '@app/services/sockets/game/game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { ServerToClientEvent } from '@common/socket.events';
import { of } from 'rxjs';
import { Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { GamePageComponent } from './game-page.component';

/* eslint-disable max-lines */
describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let timerSpy: jasmine.SpyObj<TimerComponent>;
    let fixture: ComponentFixture<GamePageComponent>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let chatBoxSpy: jasmine.SpyObj<ChatBoxComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SimpleDialogComponent>>;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;
    let httpMock: HttpTestingController;
    let mockSocket: Socket;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let navigationServiceSpy: jasmine.SpyObj<NavigationService>;
    let combatServiceSpy: jasmine.SpyObj<CombatService>;

    const accessCode = '1234';

    beforeEach(async () => {
        combatServiceSpy = jasmine.createSpyObj(CombatService, ['onEvasion', 'onCombatEnd', 'isInCombat', 'initializeCombat']);
        chatBoxSpy = jasmine.createSpyObj(ChatBoxComponent, ['unsubscribe', 'subscribe']);
        timerSpy = jasmine.createSpyObj(TimerComponent, ['pauseTimer', 'resumeTimer']);
        socketCommunicationServiceSpy = jasmine.createSpyObj(SocketCommunicationService, ['on', 'send', 'isSocketAlive', 'connect']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        dialogRefSpy = jasmine.createSpyObj('SimpleDialogComponent', ['open', 'afterClosed', 'close']);
        dialogRefSpy.afterClosed.and.returnValue(of({ action: 'left' }));
        dialogSpy.open.and.returnValue(dialogRefSpy);
        mockSocket = { data: { roomCode: '1234' }, id: 'player' } as unknown as Socket;
        gameServiceSpy = jasmine.createSpyObj('GameService', [
            'navigateToHome',
            'addGamePageListeners',
            'isActivePlayer',
            'toggleActionDoorSelected',
            'toggleActionCombatSelected',
            'isCurrentPlayerAdmin',
            'handleExit',
            'hasActionPoints',
            'isActionDoorSelected',
            'isActionCombatSelected',
            'playersTarget',
            'doorsTarget',
        ]);
        navigationServiceSpy = jasmine.createSpyObj('NavigationService', ['isDebugMode']);

        combatServiceSpy.combatTurnTime$ = of(ATTACK_TIME);
        combatServiceSpy.activePlayer = mockPlayers[0];
        combatServiceSpy.opponent = mockPlayers[1];
        combatServiceSpy.attacker = mockPlayers[0];
        combatServiceSpy.defender = mockPlayers[1];
        combatServiceSpy.evasionsActivePlayer = [1, 1];
        combatServiceSpy.evasionsOpponent = [1, 1];
        combatServiceSpy.activePlayerResult = { total: 5, diceValue: 2 };
        combatServiceSpy.opponentResult = { total: 3, diceValue: 3 };

        await TestBed.configureTestingModule({
            imports: [GamePageComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: CombatService, useValue: combatServiceSpy },
                { provide: ChatBoxComponent, useValue: chatBoxSpy },
                { provide: TimerComponent, useValue: timerSpy },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: NavigationService, useValue: navigationServiceSpy },
                { provide: ActivatedRoute, useValue: { queryParams: of({ roomCode: '1234' }) } },
            ],
        }).compileComponents();

        socketCommunicationServiceSpy.socket = mockSocket;

        httpMock = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        component.allPlayers = mockPlayers;
        fixture.detectChanges();
        component.activePlayer = JSON.parse(JSON.stringify(mockLobbyPlayers[0]));

        const request = httpMock.expectOne(`${environment.serverUrl}/chat?roomCode=${accessCode}`);
        request.flush([]);
    });

    afterEach(() => {
        httpMock.verify();
        fixture.destroy();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    describe('ngOnInit', () => {
        it('should set players and health on mapInformation event', () => {
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === ServerToClientEvent.MapInformation) {
                    callback(mockRoom as T);
                }
            });
            spyOn(component, 'replenishHealth');
            spyOn(component, 'initCombatListeners');
            spyOn(component, 'initGameListener');
            spyOn(component, 'onBeforeStartTurn');

            component.ngOnInit();
            expect(component.allPlayers).toEqual(mockRoom.listPlayers);
            expect(component.replenishHealth).toHaveBeenCalled();
        });
    });

    describe('initGameListener', () => {
        it('should set attackAround and playersTargets on AttackAround event', () => {
            const targetPlayer = JSON.parse(JSON.stringify(mockPlayer));
            socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === ServerToClientEvent.AttackAround) {
                    callback({ attackAround: true, targets: [targetPlayer] } as T);
                }
            });
            component.initGameListener();
            expect(gameServiceSpy.addGamePageListeners).toHaveBeenCalled();
            expect(component.attackAround).toBe(true);
            expect(gameServiceSpy.playersTarget).toEqual([targetPlayer]);
        });
    });

    //     it('should set players on PlayerDisconnected event', () => {
    //         socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //             if (event === ServerToClientEvent.PlayerDisconnected) {
    //                 callback(mockLobbyPlayers as T);
    //             }
    //         });
    //         component.ngOnInit();
    //         expect(component.allPlayers).toEqual(mockLobbyPlayers);
    //     });

    //     it('should set active player name on otherPlayerTurn event', () => {
    //         socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //             if (event === 'otherPlayerTurn') {
    //                 callback(mockPlayer.name as T);
    //             }
    //         });
    //         component.ngOnInit();
    //         expect(component.activePlayerName).toEqual(mockPlayer.name);
    //     });

    //     it('should disconnect on draw event', () => {
    //         socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //             if (event === 'playerFell') {
    //                 callback({} as T);
    //             }
    //         });
    //         component.ngOnInit();
    //         expect(gameServiceSpy.handlePlayerFell).toHaveBeenCalled();
    //     });

    //     it('should update dubugMode on debugMode event', () => {
    //         socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //             if (event === 'debugMode') {
    //                 callback(true as T);
    //             }
    //         });
    //         component.ngOnInit();
    //         expect(navigationServiceSpy.isDebugMode).toBeTrue();
    //     });

    //     it('should set combatInProgress to true on combatInProgress event', () => {
    //         socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //             if (event === 'combatInProgress') {
    //                 callback({} as T);
    //             }
    //         });
    //         component.ngOnInit();
    //         expect(component.combatInProgress).toBe(true);
    //     });

    //     it('should set combatInProgress to false on combatOver event', () => {
    //         socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //             if (event === 'combatOver') {
    //                 callback({} as T);
    //             }
    //         });
    //         component.ngOnInit();
    //         expect(component.combatInProgress).toBe(false);
    //     });

    //     it('should call toggleDebugMode and addEventListener on ngOnInit', () => {
    //         spyOn(component, 'toggleDebugMode');
    //         spyOn(document, 'addEventListener');
    //         component.ngOnInit();
    //         expect(component.toggleDebugMode).toHaveBeenCalled();
    //         expect(document.addEventListener).toHaveBeenCalled();
    //     });
    // });

    // it('should set isActivePlayer and isTurnStartShowed when isActive event is emitted', () => {
    //     mockSocket.id = '0';
    //     navigationServiceSpy.players = JSON.parse(JSON.stringify(mockPlayers));
    //     socketCommunicationServiceSpy.socket.id = mockPlayers[0].id;
    //     gameServiceSpy.isActivePlayer.and.returnValue(true);
    //     spyOn(component, 'initTimerEvents');
    //     socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //         if (event === ServerToClientEvent.ActivePlayer) {
    //             callback(mockPlayers[0] as T);
    //         }
    //     });
    //     component.ngAfterViewInit();
    //     expect(component.isActivePlayer).toBeTrue();
    //     expect(component.isTurnStartShowed).toBeTrue();
    //     expect(component.initTimerEvents).toHaveBeenCalled();
    // });

    // it('should toggle isActionDoorSelected correctly', () => {
    //     component.toggleActionDoorSelected();
    //     expect(gameServiceSpy.toggleActionDoorSelected).toHaveBeenCalled();
    // });

    // it('should toggle isActionCombatSelected correctly', () => {
    //     component.toggleActionCombatSelected();
    //     expect(gameServiceSpy.toggleActionCombatSelected).toHaveBeenCalled();
    // });

    // it('should set the id of the first pageDiv element to "enabled"', () => {
    //     const mockDivs = new QueryList<ElementRef<HTMLDivElement>>();
    //     const elementRef = new ElementRef(document.createElement('div'));
    //     mockDivs.reset([elementRef]);
    //     component.pageDiv = mockDivs;
    //     component.enableClicks();
    //     expect(component.pageDiv.first.nativeElement.id).toBe('enabled');
    // });

    // it('should call handleExit of gameService', () => {
    //     component.handleExit();
    //     expect(gameServiceSpy.handleExit).toHaveBeenCalled();
    // });

    // it('should navigate to /home if the dialog result is Left', () => {
    //     gameServiceSpy.openDialog.and.returnValue(of({ action: DialogResult.Left }));
    //     component.handleExit();
    //     // expect(routerSpy.navigate).toHaveBeenCalledWith([PathRoute.Home]);
    // });

    // it('should replenish health for all players', () => {
    //     expect(mockPlayer.attributes.currentHp).not.toEqual(mockPlayer.attributes.totalHp);
    //     component.replenishHealth();
    //     component.allPlayers.forEach((player) => {
    //         expect(player.attributes.currentHp).toEqual(player.attributes.totalHp);
    //     });
    // });

    // it('should return the correct player count when allPlayers is defined and has players', () => {
    //     component.allPlayers = mockPlayers;
    //     const result = component.getPlayerCount();
    //     expect(result).toBe(mockPlayers.length);
    // });

    // it('should return 0 when there are no players', () => {
    //     component.allPlayers = [];
    //     const result = component.getPlayerCount();
    //     expect(result).toBe(0);
    // });

    // it('should reset action selections before start of turn and send startTurn', () => {
    //     component.activePlayer = mockPlayers[0];
    //     gameServiceSpy.isActionCombatSelected = true;
    //     gameServiceSpy.isActionDoorSelected = true;
    //     component.onBeforeStartTurn();
    //     expect(gameServiceSpy.isActionCombatSelected).toBeFalse();
    //     expect(gameServiceSpy.isActionDoorSelected).toBeFalse();
    //     expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('startTurn');
    // });

    // it('should update timeRemainingBeforeStartTurn when beforeStartTurnTimer event is emitted', () => {
    //     socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //         if (event === 'beforeStartTurnTimer') {
    //             callback(STARTING_TIME as T);
    //         }
    //     });
    //     component.initTimerEvents();
    //     expect(component.timeRemainingBeforeStartTurn).toBe(STARTING_TIME);
    // });

    // it('should update allPlayers and call onBeforeStartTurn when turnEnded event is emitted', () => {
    //     spyOn(component, 'onBeforeStartTurn');
    //     socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //         if (event === 'turnEnded') {
    //             callback(mockPlayers as T);
    //         }
    //     });
    //     component.initTimerEvents();
    //     expect(component.allPlayers).toBe(mockPlayers);
    //     expect(component.onBeforeStartTurn).toHaveBeenCalled();
    // });

    // it('should call hasActionsPoint of gameService', () => {
    //     gameServiceSpy.hasActionPoints.and.returnValue(true);
    //     const result = component.hasActionPoints();
    //     expect(result).toBe(true);
    // });

    // it('should send event debugMode when admin presses d on keyboard', () => {
    //     navigationServiceSpy.isDebugMode = false;
    //     gameServiceSpy.isCurrentPlayerAdmin.and.returnValue(true);
    //     const event = new KeyboardEvent('keydown', { key: 'd' });
    //     document.dispatchEvent(event);
    //     expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('debugMode', true);
    // });

    // it('should not send event debugMode when player presses d on keyboard', () => {
    //     navigationServiceSpy.isDebugMode = false;
    //     gameServiceSpy.isCurrentPlayerAdmin.and.returnValue(false);
    //     const event = new KeyboardEvent('keydown', { key: 'd' });
    //     document.dispatchEvent(event);
    //     expect(socketCommunicationServiceSpy.send).not.toHaveBeenCalled();
    // });

    // it('should call enableClicks when closeTurnStartPopUp is called', () => {
    //     spyOn(component, 'enableClicks');
    //     component.closeTurnStartPopUp();
    //     expect(component.enableClicks).toHaveBeenCalled();
    // });

    // it('should call closeTurnStartPopUp and update timeRemainingStartTurn when startedTurnTimer event is emitted', () => {
    //     socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //         if (event === 'startedTurnTimer') {
    //             callback(TURN_TIME as T);
    //         }
    //     });
    //     spyOn(component, 'closeTurnStartPopUp');
    //     component.initTimerEvents();
    //     expect(component.timeRemainingStartTurn).toBe(TURN_TIME);
    // });

    // it('should update isChatFocus and call toggleDebugMode', () => {
    //     spyOn(component, 'toggleDebugMode');

    //     component.onChatFocus(true);

    //     expect(component['isChatFocus']).toBeTrue();
    //     expect(component.toggleDebugMode).toHaveBeenCalled();
    // });

    // it('should update isChatFocus to false and call toggleDebugMode', () => {
    //     spyOn(component, 'toggleDebugMode');

    //     component.onChatFocus(false);

    //     expect(component['isChatFocus']).toBeFalse();
    //     expect(component.toggleDebugMode).toHaveBeenCalled();
    // });

    // it('should toggle debug mode when "d" is pressed, chat is not focused, and player is admin', () => {
    //     gameServiceSpy.isCurrentPlayerAdmin.and.returnValue(true);
    //     navigationServiceSpy.isDebugMode = false;
    //     const event = new KeyboardEvent('keydown', { key: 'd' });
    //     component['isChatFocus'] = false;

    //     component.toggleDebugMode();
    //     component['keyDownListener'](event);

    //     expect(navigationServiceSpy.isDebugMode).toBeTrue();
    //     expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('debugMode', true);
    // });
});
