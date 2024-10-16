import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { mockRoom } from '@app/mocks/mock-room';
import { GameService } from '@app/services/sockets/game/game.service';
import { PlayerConnectionService } from '@app/services/sockets/player-connection/player-connection.service';
import { JoinGameComponent } from './join-game.component';

describe('JoinGameComponent', () => {
    let component: JoinGameComponent;
    let fixture: ComponentFixture<JoinGameComponent>;
    let activatedRouteMock: jasmine.SpyObj<ActivatedRoute>;
    let routerSpy: jasmine.SpyObj<Router>;
    let playerConnectionServiceSpy: jasmine.SpyObj<PlayerConnectionService>;
    let gameServiceSpy: jasmine.SpyObj<GameService>;

    let code: string;

    beforeEach(async () => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        playerConnectionServiceSpy = jasmine.createSpyObj('PlayerConnectionService', ['send', 'on', 'isSocketAlive', 'connect']);
        gameServiceSpy = jasmine.createSpyObj('GameService', ['setRoomId']);

        code = '1234';
        await TestBed.configureTestingModule({
            imports: [JoinGameComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
                { provide: PlayerConnectionService, useValue: playerConnectionServiceSpy },
                { provide: GameService, useValue: gameServiceSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(JoinGameComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call player connect when connecting to page', () => {
        playerConnectionServiceSpy.isSocketAlive.and.returnValue(false);
        component.connect();
        expect(playerConnectionServiceSpy.connect).toHaveBeenCalled();
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

    it('should navigate to waiting-page after creating character', () => {
        component.joinLobby(code);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/waiting-page'], { queryParams: { roomCode: code } });
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
            expect(component.errorMessage).toEqual(component.errorMessages.invalidCode);
            expect(playerConnectionServiceSpy.send).not.toHaveBeenCalled();
        });

        it('should set error message when room not found', () => {
            spyOn(component, 'isValidCode').and.returnValue(true);
            playerConnectionServiceSpy.on.and.callFake(<Room>(event: string, callback: (date: Room) => void) => {
                if (event === 'joinError') {
                    callback(mockRoom as Room);
                }
            });
            component.joinGame('1444');
            expect(component.errorMessage).toEqual(component.errorMessages.roomNotFound);
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
});
