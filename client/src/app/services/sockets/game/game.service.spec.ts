import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import {
    DialogResult,
    MAX_PLAYER_LARGE_MAP,
    MAX_PLAYER_MEDIUM_MAP,
    MAX_PLAYER_SMALL_MAP,
    SIZE_LARGE_MAP,
    SIZE_MEDIUM_MAP,
    SIZE_SMALL_MAP,
} from '@app/constants';
import { mockPlayers } from '@app/mocks/mock-players';
import { mockRoom } from '@app/mocks/mock-room';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { Player } from '@common/player';
import { of } from 'rxjs';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['send', 'on', 'once']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            providers: [
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: Router, useValue: routerSpy },
            ],
        });
        service = TestBed.inject(GameService);
    });

    it('should set roomId correctly', () => {
        const roomId = mockRoom.roomId;
        service.setRoomId(roomId);
        expect(service.roomId).toBe(roomId);
    });

    it('should join a room and set roomId and selectedGame', () => {
        socketCommunicationServiceSpy.on.and.callFake(<Room>(event: string, callback: (roomInfo: Room) => void) => {
            if (event === 'joinedRoom') {
                callback(mockRoom as Room);
            }
        });
        service.joinRoom(mockRoom.roomId);

        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('joinRoom', mockRoom.roomId);
        expect(service.isJoined).toBeTruthy();
        expect(service.selectedGame).toBe(mockRoom.gameMap);
        expect(service.roomId).toBe(mockRoom.roomId);
    });

    describe('getPlayerNumber', () => {
        it('should return max players for small map', () => {
            const result = service.getPlayerNumber(SIZE_SMALL_MAP);
            expect(result).toEqual(MAX_PLAYER_SMALL_MAP);
        });

        it('should return max players for medium map', () => {
            const result = service.getPlayerNumber(SIZE_MEDIUM_MAP);
            expect(result).toEqual(MAX_PLAYER_MEDIUM_MAP);
        });

        it('should return max players for large map', () => {
            const result = service.getPlayerNumber(SIZE_LARGE_MAP);
            expect(result).toEqual(MAX_PLAYER_LARGE_MAP);
        });

        it('should throw an error for invalid height', () => {
            const invalidHeight = 5;
            expect(() => service.getPlayerNumber(invalidHeight)).toThrowError('Nombre de joueur invalide');
        });
    });

    it('should open a dialog and not send leave if result is not leave', () => {
        const dialogData = {
            title: 'Partie verrouillée',
            messages: ['Veuillez réessayer plus tard ou retourner au menu principal '],
            options: ['Quitter', 'Rester'],
            confirm: true,
            itemSwap: null,
        };
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('stay'));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        service.openDialog(dialogData);
        expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
            disableClose: true,
            data: dialogData,
        });
    });

    it('should navigate when result is Close onAdminQuit', (done) => {
        const message = 'Game has been canceled';
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of(DialogResult.Close));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        service.onAdminQuit(message);
        setTimeout(() => {
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
            done();
        });
    });

    it('should send leaveRoom when result is left onPlayerQuit', (done) => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of(DialogResult.Left));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        service.onPlayerQuit(mockRoom.roomId);
        setTimeout(() => {
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('leaveRoom', mockRoom.roomId);
            done();
        });
    });

    it('should navigate to join-game when result is close onPlayerKickedOut', (done) => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of(DialogResult.Close));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        service.onPlayerKickedOut();
        setTimeout(() => {
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/join-game']);
            done();
        });
    });

    it('should call onAdminQuit on roomDeleted event', () => {
        const message = 'Game has been canceled';
        socketCommunicationServiceSpy.once.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'roomDeleted') {
                callback(message as T);
            }
        });
        spyOn(service, 'onAdminQuit');
        service.onRoomDeleted();
        expect(socketCommunicationServiceSpy.once).toHaveBeenCalled();
        expect(service.onAdminQuit).toHaveBeenCalledWith(message);
    });

    it('should call onPlayerKickedOut on kickPlayer event', () => {
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'kickPlayer') {
                callback({} as T);
            }
        });
        spyOn(service, 'onPlayerKickedOut');
        service.onKickPlayer();
        expect(socketCommunicationServiceSpy.on).toHaveBeenCalled();
        expect(service.onPlayerKickedOut).toHaveBeenCalledWith();
    });

    it('should navigate to game-creation when admin on leftRoom event', () => {
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'leftRoom') {
                callback(true as T);
            }
        });
        service.onLeftRoom();
        expect(socketCommunicationServiceSpy.on).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/game-creation']);
    });

    it('should navigate to home when not admin on leftRoom event', () => {
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'leftRoom') {
                callback(false as T);
            }
        });
        service.onLeftRoom();
        expect(socketCommunicationServiceSpy.on).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should return true if player has action points', () => {
        const player = { attributes: { actionPoints: 1 } } as unknown as Player;
        expect(service.hasActionPoints(player)).toBeTrue();
    });

    it('should return false if player has no action points', () => {
        const player = JSON.parse(JSON.stringify(mockPlayers[0]));
        player.attributes.actionPoints = 0;
        expect(service.hasActionPoints(player)).toBeFalse();
    });
});
