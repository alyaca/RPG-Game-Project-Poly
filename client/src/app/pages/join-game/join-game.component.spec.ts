import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SimpleDialogComponent } from '@app/components/simple-dialog/simple-dialog.component';
import { mockAvatars } from '@app/mocks/mock-avatars';
import { mockAvatar, mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { mockRoom } from '@app/mocks/mock-room';
import { GameService } from '@app/services/sockets/game/game.service';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';
import { of } from 'rxjs';
import { JoinGameComponent } from './join-game.component';

describe('JoinGameComponent', () => {
    let component: JoinGameComponent;
    let fixture: ComponentFixture<JoinGameComponent>;
    let activatedRouteMock: jasmine.SpyObj<ActivatedRoute>;
    let routerSpy: jasmine.SpyObj<Router>;
    let playerConnectionServiceSpy: jasmine.SpyObj<PlayerConnectionService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;
    let dialogSpy: jasmine.SpyObj<MatDialog>;

    let code: string;

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        playerConnectionServiceSpy = jasmine.createSpyObj('PlayerConnectionService', ['send', 'on', 'once', 'isSocketAlive', 'connect']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['setRoomId']);
        dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

        code = '1234';
        await TestBed.configureTestingModule({
            imports: [JoinGameComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
                { provide: PlayerConnectionService, useValue: playerConnectionServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
                { provide: MatDialog, useValue: dialogSpy },
            ],
        }).compileComponents();

        playerConnectionServiceSpy.on.and.callFake(<T>(event: string, callback: (data: T) => void) => {
            if (event === 'characterSelected') {
                callback(mockAvatars as T);
            }
        });

        fixture = TestBed.createComponent(JoinGameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call connect when connecting to page', () => {
        expect(playerConnectionServiceSpy.connect).toHaveBeenCalled();
        expect(component.availableAvatars).toEqual(mockAvatars);
    });

    describe('isValideCode', () => {
        it('should be true if the code is 4 numbers', () => {
            expect(component.isValidCode(code)).toBeTruthy();
        });

        it('should be false if the code is not composed of 4 numbers', () => {
            const roomCode = '12o4';
            expect(component.isValidCode(roomCode)).toBeFalsy();
        });

        it('should be false if the code length is smaller than 4 numbers', () => {
            const roomCode = '123';
            expect(component.isValidCode(roomCode)).toBeFalsy();
        });

        it('should be false if the code are not numbers', () => {
            const roomCode = 'pljd';
            expect(component.isValidCode(roomCode)).toBeFalsy();
        });
    });

    describe('joinLobby', () => {
        it('should handle locked room ', () => {
            gameServiceSpy.roomId = 'testRoomId';
            playerConnectionServiceSpy.once.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'isRoomLocked') {
                    callback(true as T);
                }
            });

            spyOn(component, 'handleLockedRoom');
            component.joinLobby(mockLobbyPlayers[0]);

            expect(playerConnectionServiceSpy.send).toHaveBeenCalledWith('isLocked', 'testRoomId');
            expect(component.handleLockedRoom).toHaveBeenCalled();
            expect(playerConnectionServiceSpy.send).not.toHaveBeenCalledWith('createPlayer', mockLobbyPlayers[0]);
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });

        it('should navigate to /waiting-page when room is unlocked ', () => {
            gameServiceSpy.roomId = code;
            playerConnectionServiceSpy.once.and.callFake(<T>(event: string, callback: (data: T) => void) => {
                if (event === 'isRoomLocked') {
                    callback(false as T);
                }
            });

            spyOn(component, 'handleLockedRoom');
            component.joinLobby(mockLobbyPlayers[0]);

            expect(playerConnectionServiceSpy.send).toHaveBeenCalledWith('isLocked', code);
            expect(component.handleLockedRoom).not.toHaveBeenCalled();
            expect(playerConnectionServiceSpy.send).toHaveBeenCalledWith('createPlayer', mockLobbyPlayers[0]);
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/waiting-page'], { queryParams: { roomCode: code } });
        });
    });

    it('should set isCharacterFormVisible to false when leaving a game and navigate to home', () => {
        const isAdmin = false;
        playerConnectionServiceSpy.on.and.callFake(<T>(event: string, callback: (isAdmin: T) => void) => {
            if (event === 'leftRoom') {
                callback(isAdmin as T);
            }
        });
        component.leaveGame(code);
        expect(component.isCharacterFormVisible).toBeFalsy();
        expect(playerConnectionServiceSpy.send).toHaveBeenCalledWith('leaveRoom', code);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/join-page']);
    });

    it('should set isJoined and isCharacterFormVisible to true and update room id and game name', () => {
        component.onJoinGame(mockRoom);

        expect(component.isJoined).toBeTrue();
        expect(component.isCharacterFormVisible).toBeTrue();
        expect(gameServiceSpy.setRoomId).toHaveBeenCalledWith('1234');
        expect(gameServiceSpy.selectedGame).toEqual(mockRoom.gameMap);
    });

    describe('joinGame', () => {
        it('should set error message when access code is invalid', () => {
            spyOn(component, 'isValidCode').and.returnValue(false);
            component.joinGame('123');

            expect(component.submitForm).toBeTruthy();
            expect(component.errorMessage).toEqual('Le code doit être composé de 4 chiffres');
            expect(playerConnectionServiceSpy.send).not.toHaveBeenCalled();
        });

        it('should set error message when room not found', () => {
            spyOn(component, 'isValidCode').and.returnValue(true);
            playerConnectionServiceSpy.on.and.callFake(<T>(event: string, callback: (date: T) => void) => {
                if (event === 'joinError') {
                    callback('roomNotFound' as unknown as T);
                }
            });
            component.joinGame('1444');
            expect(component.errorMessage).toEqual('La partie est inexistante');
        });

        it('should send joinRoom and handle successful join', () => {
            spyOn(component, 'isValidCode').and.returnValue(true);
            playerConnectionServiceSpy.on.and.callFake(<Room>(event: string, callback: (date: Room) => void) => {
                if (event === 'joinedRoom') {
                    callback(mockRoom as Room);
                }
            });
            spyOn(component, 'onJoinGame');

            component.joinGame(mockRoom.roomId);

            expect(component.submitForm).toBeTrue();
            expect(playerConnectionServiceSpy.send).toHaveBeenCalledWith('joinRoom', mockRoom.roomId);
            expect(component.errorMessage).toBe('');
            expect(component.onJoinGame).toHaveBeenCalledWith(mockRoom);
        });
    });

    it('should return undefined if not a known error type', () => {
        const result = component.setErrorMessage(undefined);
        expect(result).toBeUndefined();
    });

    it('should open a dialog and not send leave if result is not leave', () => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('stay'));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        component.handleLockedRoom();
        expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
            disableClose: true,
            data: { title: 'Partie verrouillée', messages: ['Veuillez réessayer plus tard ou retourner au menu principal '], confirm: true },
        });
        expect(routerSpy.navigate).not.toHaveBeenCalledWith(['/home']);
    });

    it('should open the dialog and navigate to /home if confirmed', () => {
        const dialogRefSpy = jasmine.createSpyObj('DialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of('leave'));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        component.handleLockedRoom();
        expect(dialogSpy.open).toHaveBeenCalledWith(SimpleDialogComponent, {
            disableClose: true,
            data: { title: 'Partie verrouillée', messages: ['Veuillez réessayer plus tard ou retourner au menu principal '], confirm: true },
        });
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should send selected avatar to playerConnectionService', () => {
        component.selectedAvatar(mockAvatar);
        expect(playerConnectionServiceSpy.send).toHaveBeenCalledWith('selectCharacter', mockAvatar);
    });
});
