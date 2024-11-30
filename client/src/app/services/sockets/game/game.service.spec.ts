import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { TemporaryDialogComponent } from '@app/components/temporary-dialog/temporary-dialog.component';
import {
    DialogMessages,
    DialogOptions,
    DialogResult,
    DialogTitle,
    INFO_DIALOG_TIME,
    MAX_PLAYER_LARGE_MAP,
    MAX_PLAYER_MEDIUM_MAP,
    MAX_PLAYER_SMALL_MAP,
    NO_OBJECT,
    SIZE_LARGE_MAP,
    SIZE_MEDIUM_MAP,
    SIZE_SMALL_MAP,
    WARNING_TIME,
} from '@app/constants';
import { mockPlayers } from '@app/mocks/mock-players';
import { MOCK_COLUMN, MOCK_ROW } from '@app/mocks/mock-position';
import { mockRoom } from '@app/mocks/mock-room';
import { NavigationService } from '@app/services/navigation/navigation.service';
import { PostGameService } from '@app/services/post-game/post-game.service';
import { SocketCommunicationService } from '@app/services/sockets/socket-communication/socket-communication.service';
import { ObjectType } from '@common/avatars-info';
import { GridOperationsInfo } from '@common/interfaces/grid-operations-info';
import { Player } from '@common/interfaces/player';
import { PathRoute } from '@common/interfaces/route';
import { ClientToServerEvent, ServerToClientEvent } from '@common/socket.events';
import { of } from 'rxjs';
import { GameService } from './game.service';

describe('GameService', () => {
    let service: GameService;
    let socketCommunicationServiceSpy: jasmine.SpyObj<SocketCommunicationService>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let routerSpy: jasmine.SpyObj<Router>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<TemporaryDialogComponent>>;
    let navigationServiceSpy: jasmine.SpyObj<NavigationService>;
    let postGameServiceSpy: jasmine.SpyObj<PostGameService>;

    beforeEach(() => {
        navigationServiceSpy = jasmine.createSpyObj('NavigationService', ['isNeighbor']);
        socketCommunicationServiceSpy = jasmine.createSpyObj('SocketCommunicationService', ['send', 'on', 'once', 'disconnect']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        dialogRefSpy = jasmine.createSpyObj('TemporaryDialogComponent', ['afterClosed', 'close']);
        dialogRefSpy.afterClosed.and.returnValue(of(undefined));
        dialogSpy.open.and.returnValue(dialogRefSpy);
        postGameServiceSpy = jasmine.createSpyObj('PostGameService', ['transferRoomStats']);

        TestBed.configureTestingModule({
            providers: [
                { provide: SocketCommunicationService, useValue: socketCommunicationServiceSpy },
                { provide: MatDialog, useValue: dialogSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: { queryParams: of({ roomCode: '1234' }) } },
                { provide: NavigationService, useValue: navigationServiceSpy },
                { provide: PostGameService, useValue: postGameServiceSpy },
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
        const dialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRef.afterClosed.and.returnValue(of(DialogOptions.Stay));
        dialogSpy.open.and.returnValue(dialogRef);

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
        const dialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogSpy.open.and.returnValue(dialogRef);

        service.openTempDialog(dialogData);
        expect(dialogSpy.open).toHaveBeenCalledWith(TemporaryDialogComponent, {
            disableClose: true,
            data: dialogData,
        });
    });

    it('should navigate when result is Close openAdminQuitDialog', (done) => {
        const message = 'message';
        const dialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRef.afterClosed.and.returnValue(of(DialogResult.Close));
        dialogSpy.open.and.returnValue(dialogRef);

        service.openAdminQuitDialog(message);

        setTimeout(() => {
            expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
                disableClose: true,
                data: {
                    title: DialogTitle.GameCanceled,
                    messages: [message],
                    confirm: false,
                    options: [DialogOptions.Close],
                },
            });
            expect(routerSpy.navigate).toHaveBeenCalledWith([PathRoute.Home]);
            done();
        });
    });

    it('isActionSelected should return the correct attribute', () => {
        service.isActionDoorSelected = true;
        service.isActionCombatSelected = false;
        expect(service.isActionSelected()).toEqual(service.isActionDoorSelected);

        service.isActionDoorSelected = false;
        service.isActionCombatSelected = true;
        expect(service.isActionSelected()).toEqual(service.isActionCombatSelected);
    });

    // it('should send leaveRoom when result is left onPlayerQuit', (done) => {
    //     const dialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
    //     dialogRef.afterClosed.and.returnValue(of({ action: DialogResult.Left }));
    //     dialogSpy.open.and.returnValue(dialogRef);

    //     service.onPlayerQuit(mockRoom.roomId);
    //     setTimeout(() => {
    //         expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('leaveRoom', mockRoom.roomId);
    //         done();
    //     });
    // });

    // it('should navigate to home when result is close onPlayerKickedOut', (done) => {
    //     const dialogRef = jasmine.createSpyObj('DialogRef', ['afterClosed']);
    //     dialogRef.afterClosed.and.returnValue(of({ action: DialogResult.Close }));
    //     dialogSpy.open.and.returnValue(dialogRef);

    //     service.onPlayerKickedOut();
    //     setTimeout(() => {
    //         expect(routerSpy.navigate).toHaveBeenCalledWith([PathRoute.Home]);
    //         done();
    //     });
    // });

    // it('should call openAdminQuitDialog on roomDeleted event', () => {
    //     const message = 'Game has been canceled';
    //     socketCommunicationServiceSpy.once.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //         if (event === 'roomDeleted') {
    //             callback(message as T);
    //         }
    //     });
    //     spyOn(service, 'openAdminQuitDialog');
    //     service.handleRoomDeleted();
    //     expect(socketCommunicationServiceSpy.once).toHaveBeenCalled();
    //     expect(service.openAdminQuitDialog).toHaveBeenCalledWith(message);
    // });

    // it('should call onPlayerKickedOut on kickPlayer event', () => {
    //     socketCommunicationServiceSpy.once.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //         if (event === 'kickPlayer') {
    //             callback({} as T);
    //         }
    //     });
    //     spyOn(service, 'onPlayerKickedOut');
    //     service.onKickPlayer();
    //     expect(socketCommunicationServiceSpy.once).toHaveBeenCalled();
    //     expect(service.onPlayerKickedOut).toHaveBeenCalledWith();
    // });

    // it('should navigate to game-creation when admin on leftRoom event', () => {
    //     socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //         if (event === ServerToClientEvent.LeftRoom) {
    //             callback(true as T);
    //         }
    //     });
    //     service.onLeftRoom();
    //     expect(socketCommunicationServiceSpy.on).toHaveBeenCalled();
    //     expect(routerSpy.navigate).toHaveBeenCalledWith([PathRoute.CreateGame]);
    // });

    // it('should navigate to home when not admin on leftRoom event', () => {
    //     socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //         if (event === ServerToClientEvent.LeftRoom) {
    //             callback(false as T);
    //         }
    //     });
    //     service.onLeftRoom();
    //     expect(socketCommunicationServiceSpy.on).toHaveBeenCalled();
    //     expect(routerSpy.navigate).toHaveBeenCalledWith([PathRoute.Home]);
    // });

    it('should return the correct boolean depending on actionPoints for canOpenDoor', () => {
        const player = { ...mockPlayers[0] };
        player.attributes.actionPoints = 1;
        service.isActionDoorSelected = true;
        expect(service.canOpenDoor(player)).toBeTrue();

        player.attributes.actionPoints = 0;
        expect(service.canOpenDoor(player)).toBeFalse();

        player.attributes.actionPoints = 1;
        service.isActionDoorSelected = false;
        expect(service.canOpenDoor(player)).toBeFalse();
    });

    it('should return the correct boolean for canStartCombat', () => {
        const player = { ...mockPlayers[0] };
        player.attributes.actionPoints = 1;
        service.isActionCombatSelected = true;
        expect(service.canStartCombat(player)).toBeTrue();

        service.isActionCombatSelected = false;
        expect(service.canStartCombat(player)).toBeFalse();

        player.attributes.actionPoints = 0;
        service.isActionCombatSelected = true;
        expect(service.canStartCombat(player)).toBeFalse();
    });

    it('tileHasPlayer should return true if tile does not contain a spawn', () => {
        const objects = [[ObjectType.Hestia,0]];
        expect(service.tileHasPlayer({ x: 0, y: 0 }, objects)).toBeTrue();

        objects[0][0] = NO_OBJECT;
        expect(service.tileHasPlayer({x: 0, y: 0 }, objects)).toBeFalse();
    });

    it('should call the correct methods on handleFightAction', () => {
        navigationServiceSpy.players = mockPlayers;
        const info : GridOperationsInfo = { position: { x: 0, y: 0 }, tiles: [[ 1,1 ],[ 1,1 ]], objects: [[ 0,0 ], [ 3, 0 ]]};
        navigationServiceSpy.isNeighbor.and.returnValue(false);
        expect(service.handleFightAction(info, { ...mockPlayers[0] })).toEqual({ ...mockPlayers[0] });

        navigationServiceSpy.isNeighbor.and.returnValue(true);
        spyOn(service, 'tileHasPlayer').and.returnValue(true);
        service.handleFightAction(info, { ...mockPlayers[0] });
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalled();
    })

    it('should disconnect and navigate /home on drawGame event', () => {
        socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === ServerToClientEvent.DrawGame) {
                callback({} as T);
            }
        });
        service.handleDrawGame();

        expect(dialogSpy.open).toHaveBeenCalledWith(TemporaryDialogComponent, {
            disableClose: true,
            data: {
                title: DialogTitle.DrawGame,
                message: DialogMessages.DrawGame,
                duration: INFO_DIALOG_TIME,
            },
        });

        expect(socketCommunicationServiceSpy.disconnect).toHaveBeenCalled();
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

    // TODO : adapt test for the service
    // it('should not navigate to home if the dialog is right', () => {
    //     gameServiceSpy.openDialog.and.returnValue(of({ action: DialogResult.Right }));

    //     component.handleExit();
    //     expect(gameServiceSpy.openDialog).toHaveBeenCalledWith({
    //         title: DialogTitle.QuitGame,
    //         messages: [DialogMessages.QuitGame],
    //         options: [DialogOptions.Quit, DialogOptions.Stay],
    //         confirm: true,
    //     });
    // });

    it('handleEndGame should call the correct functions on EndGame event', () => {
        const data = { winner: { ...mockPlayers[0]} , room: mockRoom};
        socketCommunicationServiceSpy.once.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === ServerToClientEvent.EndGame) {
                callback(data as T);
            }
        });
        spyOn(service, 'openDialog').and.returnValue(of ({ action: DialogResult.Close }));
        spyOn(service, 'removeGamePageListeners');
        service.handleEndGame();
        expect(service.removeGamePageListeners).toHaveBeenCalled();
        expect(postGameServiceSpy.transferRoomStats).toHaveBeenCalled();
        expect(service.openDialog).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith([PathRoute.PostGame], { queryParams: { roomCode: data.room.roomId}});
    });

    it('should open the admin quit dialog on roomDeleted', () => {
        socketCommunicationServiceSpy.once.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === ServerToClientEvent.RoomDeleted) {
                callback('room deleted' as T);
            }
        });
        spyOn(service, 'openAdminQuitDialog');
        service.handleRoomDeleted();
        expect(service.openAdminQuitDialog).toHaveBeenCalled();
    });

    it('should call openplayerKickoutDialog on kickPlayer', () => {
        socketCommunicationServiceSpy.once.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === ServerToClientEvent.KickPlayer) { 
                callback({} as T);
            }
        });
        spyOn(service, 'openPlayerKickoutDialog');
        service.handleKickPlayer();
        expect(service.openPlayerKickoutDialog).toHaveBeenCalled();
    });

    it('should send leave room if a player quits', () => {
        spyOn(service, 'openDialog').and.returnValue(of ({ action: DialogResult.Left}));
        service.openPlayerQuitDialog(mockRoom.roomId);
        expect(service.openDialog).toHaveBeenCalled();
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalled();
    });

    it('should send the LeaveRoom event when a player leaves the post game', () => {
        spyOn(service, 'openDialog').and.returnValue(of ({ action: DialogResult.Left }));
        service.openQuitPostGameLobby(mockRoom.roomId);
        expect(service.openDialog).toHaveBeenCalled();
        expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith(ClientToServerEvent.LeaveRoom, mockRoom.roomId);
    });

    it('should call navigateToHome if the player gets kicked out', () => {
        spyOn(service, 'openDialog').and.returnValue(of ({ action: DialogResult.Close}));
        spyOn(service, 'navigateToHome');
        service.openPlayerKickoutDialog();
        expect(service.openDialog).toHaveBeenCalled();
        expect(service.navigateToHome).toHaveBeenCalled();
    });

    // it('should send debugMode event when admin leaves the game', () => {
    //     gameServiceSpy.isCurrentPlayerAdmin.and.returnValue(true);
    //     gameServiceSpy.openDialog.and.returnValue(of({ action: DialogResult.Left }));

    //     component.handleExit();
    //     expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('debugMode', false);
    // });

    // it('should call gameService.openTempDialog with the correct parameters for onPlayerFell', () => {
    //     gameServiceSpy.openTempDialog.and.returnValue(of(undefined));
    //     spyOn(component, 'onEndTurn');

    //     component.onPlayerFell();

    //     expect(gameServiceSpy.openTempDialog).toHaveBeenCalledWith({
    //         title: DialogTitle.EndTurn,
    //         message: DialogMessages.Fell,
    //         duration: INFO_DIALOG_TIME,
    //     });
    // expect(socketCommunicationServiceSpy.send).toHaveBeenCalledWith('endTurn');
    //     expect(component.onEndTurn).toHaveBeenCalled();
    // });

    //     it('should disconnect on draw event', () => {
    //         socketCommunicationServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
    //             if (event === 'playerFell') {
    //                 callback({} as T);
    //             }
    //         });
    //         component.ngOnInit();
    //         expect(gameServiceSpy.handlePlayerFell).toHaveBeenCalled();
    //     });

    // it('should navigate to /home if the dialog result is Left', () => {
    //     gameServiceSpy.openDialog.and.returnValue(of({ action: DialogResult.Left }));
    //     component.handleExit();
    //     // expect(routerSpy.navigate).toHaveBeenCalledWith([PathRoute.Home]);
    // });
});
