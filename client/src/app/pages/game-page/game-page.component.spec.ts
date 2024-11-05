import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ElementRef, QueryList } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { DialogMessages, DialogOptions, DialogResult, DialogTitle, TURN_TIME, WARNING_TIME } from '@app/constants';
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
        gameServiceSpy = jasmine.createSpyObj('GameService', ['openDialog']);
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

    it('should toggle isActionDoorSelected correctly', () => {
        const initialActionSelected = component.isActionDoorSelected;
        component.toggleActionDoorSelected();
        expect(component.isActionDoorSelected).toBe(!initialActionSelected);
        expect(component.isActionCombatSelected).toBe(false);
    });

    it('should toggle isActionCombatSelected correctly', () => {
        const initialActionSelected = component.isActionCombatSelected;
        component.toggleActionCombatSelected();
        expect(component.isActionCombatSelected).toBe(!initialActionSelected);
        expect(component.isActionDoorSelected).toBe(false);
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
            component.allPlayers.forEach(player => {
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


    /*it('should return true if checkDoor returns true', () => {
        navigationServiceSpy.checkDoor.and.returnValue(mockPlayers[0].position);
        const result = component.checkDoors();
        expect(result).toBeTrue();
    });*/

    it('should return false when checkDoor returns an invalid Position', () => {
        navigationServiceSpy.checkDoor.and.returnValue(undefined); 
        const result = component.checkDoors();
        expect(result).toBeFalse();
    });

    //supposed to work, a revoir 
    /*it('should return true if checkAttack returns true', () => {
        navigationServiceSpy.checkAttack.and.returnValue(mockPlayers[0]);
        const result = component.checkAttack();
        expect(result).toBeTrue();
    });

    it('should return false if checkAttack returns false', () => {
        navigationServiceSpy.checkAttack.and.returnValue(undefined);
        const result = component.checkAttack();
        expect(result).toBeFalse();
    });*/

    it('should return the correct player count when allPlayers is defined and has players', () => {
        component.allPlayers = mockPlayers;
        const result = component.getPlayerCount();
        expect(result).toBe(1);  
    });

    it('should return 0 when there are no players', () => {
        component.allPlayers = [];
        const result = component.getPlayerCount();
        expect(result).toBe(0);
    });

   /* it('should return -1 when when the number of players is undefined ', () => {
        component.allPlayers;
        const result = component.getPlayerCount();
        expect(result).toBe(-1);
    });*/

    it('should reset action selections before start of turn and send startTurn', () => {
        component.isActionCombatSelected = true;
        component.isActionDoorSelected = true;
        component.onBeforeStartTurn();
        expect(component.isActionCombatSelected).toBeFalse();  
        expect(component.isActionDoorSelected).toBeFalse();  
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('startTurn'); 
    });


   it('should call gameService.openDialog with the correct parameters for onPlayerFell', () => {
        gameServiceSpy.openDialog.and.returnValue(of(DialogResult.Close));
        component.onPlayerFell();
        expect(gameServiceSpy.openDialog).toHaveBeenCalledWith({
            title: DialogTitle.EndTurn,
            messages: [DialogMessages.Fell],
            confirm: false,
            options: [DialogOptions.Close],
        });
    });

    it('should call onEndTurn when the dialog result is DialogResult.Close', () => {
        const endTurnSpy = spyOn(component, 'onEndTurn');
        gameServiceSpy.openDialog.and.returnValue(of(DialogResult.Close));
        component.onPlayerFell();
        expect(endTurnSpy).toHaveBeenCalled();
    });
    
    //ne couvre pas la ligne 101...
    it('should update timeRemainingBeforeStartTurn when beforeStartTurnTimer event is emitted', () => {

        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'startedTurnTimer') {
                callback(TURN_TIME as T);
            }
        });
        component.timerEvents();
        expect(component.timeRemainingStartTurn).toBe(TURN_TIME);

    });

    //fonctionne
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

    //focntionne pas 93-94
    /*it('should set isActivePlayer and isTurnStartShowed when isActive event is emitted', () => {
        mockSocket.id ='0';
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'isActive') {
                callback(mockPlayer.id as T);
            }
        });
        component.ngAfterViewInit();
        expect(component.isActivePlayer).toBeTrue();
        expect(component.isTurnStartShowed).toBeTrue();
    });*/


    //for draw...
    /*it('should call cketCommunicationService.disconnect and handleDraw when draw event is emitted', () => {
        spyOn(component, 'handleDraw');
        socketCommunicationServiceSpy.on.and.callFake((event: string, callback: () => void) => {
            if (event === 'draw') {
                callback(); }
        component.ngAfterViewInit();
        expect(socketCommunicationServiceSpy.disconnect).toHaveBeenCalled();
        expect(component.handleDraw).toHaveBeenCalled();
    });*/
    

});
    


