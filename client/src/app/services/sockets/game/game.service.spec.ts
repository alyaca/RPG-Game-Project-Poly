import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
import {
    DialogMessages,
    DialogResult,
    DialogTitle,
    MAX_PLAYER_LARGE_MAP,
    MAX_PLAYER_MEDIUM_MAP,
    MAX_PLAYER_SMALL_MAP,
    SIZE_LARGE_MAP,
    SIZE_MEDIUM_MAP,
    SIZE_SMALL_MAP,
    WARNING_TIME,
} from '@app/constants';
import { mockPlayers } from '@app/mocks/mock-players';
import { MOCK_COLUMN, MOCK_ROW } from '@app/mocks/mock-position';
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

    it('should open a dialog and not send leave if result is not leave', () => {
        const dialogData = {
            title: DialogTitle.EndFight,
            message: DialogMessages.EndFight,
            duration: WARNING_TIME,
        };
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogSpy.open.and.returnValue(dialogRefSpy);

        service.openTempDialog(dialogData);
        expect(dialogSpy.open).toHaveBeenCalledWith(TemporaryDialogComponent, {
            disableClose: true,
            data: dialogData,
        });
    });

    it('should navigate when result is Close onAdminQuit', (done) => {
        const message = 'Game has been canceled';
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of({ action: DialogResult.Close }));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        service.onAdminQuit(message);
        setTimeout(() => {
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
            done();
        });
    });

    it('should send leaveRoom when result is left onPlayerQuit', (done) => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of({ action: DialogResult.Left }));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        service.onPlayerQuit(mockRoom.roomId);
        setTimeout(() => {
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('leaveRoom', mockRoom.roomId);
            done();
        });
    });

    it('should navigate to home when result is close onPlayerKickedOut', (done) => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of({ action: DialogResult.Close }));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        service.onPlayerKickedOut();
        setTimeout(() => {
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
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
        socketCommunicationServiceSpy.once.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'kickPlayer') {
                callback({} as T);
            }
        });
        spyOn(service, 'onPlayerKickedOut');
        service.onKickPlayer();
        expect(socketCommunicationServiceSpy.once).toHaveBeenCalled();
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

    it('should return true if action selected', () => {
        service.isActionDoorSelected = true;
        expect(service.isActionSelected()).toBe(true);
        service.isActionDoorSelected = false;
        service.isActionCombatSelected = true;
        expect(service.isActionSelected()).toBe(true);
    });

    it('should return false if action not selected', () => {
        service.isActionDoorSelected = false;
        service.isActionCombatSelected = false;
        expect(service.isActionSelected()).toBe(false);
    });

    it('should return true if is a target door', () => {
        spyOn(service, 'isTargetDoor').and.returnValue(true);
        expect(service.isTarget(MOCK_ROW, MOCK_COLUMN)).toBe(true);
    });

    it('should return true if is a target player ', () => {
        spyOn(service, 'isTargetDoor').and.returnValue(false);
        spyOn(service, 'isTargetPlayer').and.returnValue(true);
        expect(service.isTarget(MOCK_ROW, MOCK_COLUMN)).toBe(true);
    });

    it('should return false if not a target', () => {
        spyOn(service, 'isTargetDoor').and.returnValue(false);
        spyOn(service, 'isTargetPlayer').and.returnValue(false);
        expect(service.isTarget(MOCK_ROW, MOCK_COLUMN)).toBe(false);
    });

    it('should return false if action door is not selected', () => {
        service.isActionDoorSelected = false;
        expect(service.isTargetDoor(MOCK_ROW, MOCK_COLUMN)).toBe(false);
    });

    it('should return true if action door is selected', () => {
        service.doorsTarget = [{ x: MOCK_ROW, y: MOCK_COLUMN }];
        service.isActionDoorSelected = true;
        expect(service.isTargetDoor(MOCK_ROW, MOCK_COLUMN)).toBe(true);
    });

    it('should return false if action combat is not selected', () => {
        service.isActionCombatSelected = false;
        expect(service.isTargetPlayer(MOCK_ROW, MOCK_COLUMN)).toBe(false);
    });

    it('should return true if action combat is selected', () => {
        const player = { position: { x: MOCK_ROW, y: MOCK_COLUMN } } as Player;
        service.playersTarget = [player];
        service.isActionCombatSelected = true;
        expect(service.isTargetPlayer(MOCK_ROW, MOCK_COLUMN)).toBe(true);
    });

    it('should send leaveRoom when result is left onQuitPostGameLobby', (done) => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of({ action: DialogResult.Left }));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        service.onQuitPostGameLobby(mockRoom.roomId);
        setTimeout(() => {
            expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('leaveRoom', mockRoom.roomId);
            done();
        });
    });
});
