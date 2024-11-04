import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ElementRef, QueryList } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { TURN_TIME, WARNING_TIME } from '@app/constants';
import { mockPlayer } from '@app/mocks/mock-player';
import { mockPlayers } from '@app/mocks/mock-players';
import { mockRoom } from '@app/mocks/mock-room';
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
    const accessCode = '1234';

    beforeEach(async () => {
        chatBoxSpy = jasmine.createSpyObj(ChatBoxComponent, ['unsubscribe', 'subscribe']);
        timerSpy = jasmine.createSpyObj(TimerComponent, ['pauseTimer', 'resumeTimer']);
        socketCommunicationServiceSpy = jasmine.createSpyObj(SocketCommunicationService, ['on', 'send', 'isSocketAlive', 'connect']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        dialogRefSpy = jasmine.createSpyObj('SimpleDialogComponent', ['open', 'afterClosed', 'close']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        dialogRefSpy.afterClosed.and.returnValue(of('left'));
        dialogSpy.open.and.returnValue(dialogRefSpy);
        mockSocket = { data: { roomCode: '1234' }, id: 'player' } as unknown as Socket;

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

    it('should toggle isActionSelected correctly', () => {
        const initialActionSelected = component.isActionSelected;
        component.toggleActionSelected();
        expect(component.isActionSelected).toBe(!initialActionSelected);
    });

    it('should set the id of the first pageDiv element to "enabled"', () => {
        const mockDivs = new QueryList<ElementRef<HTMLDivElement>>();
        const elementRef = new ElementRef(document.createElement('div'));
        mockDivs.reset([elementRef]);
        component.pageDiv = mockDivs;
        component.enableClicks();
        expect(component.pageDiv.first.nativeElement.id).toBe('enabled');
    });

    it('should open a confirmation dialog and navigate when quitting the game', () => {
        component.handleExit();
        expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
            disableClose: true,
            data: {
                title: 'Abandonner la partie?',
                messages: ['- Êtes-vous certains de vouloir quitter?'],
                options: ['Quitter', 'Rester'],
                confirm: true,
            },
        });
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should not navigate if the dialog result is not "left"', () => {
        dialogRefSpy.afterClosed.and.returnValue(of('stay'));
        component.handleExit();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
});
