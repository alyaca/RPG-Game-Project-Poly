import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LobbyPlayerComponent } from './lobby-player.component';
import { Player, Status } from '@common/player';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';

describe('LobbyPlayerComponent', () => {
    let component: LobbyPlayerComponent;
    let fixture: ComponentFixture<LobbyPlayerComponent>;

    const mockLobbyPlayer: Player = mockLobbyPlayers[0];
    const mockLobbyPlayer: Player = mockLobbyPlayers[0];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LobbyPlayerComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(LobbyPlayerComponent);
        component = fixture.componentInstance;
        component.lobbyPlayer = mockLobbyPlayer;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should return true if lobbyPlayer status is Admin', () => {
        mockLobbyPlayer.status = Status.Admin;
        component.lobbyPlayer = mockLobbyPlayer; 
        const result = component.isAdmin();
        expect(result).toBeTrue();
    });

    it('should return false if lobbyPlayer status is not Admin', () => {
        mockLobbyPlayer.status = Status.Player;
        component.lobbyPlayer = mockLobbyPlayer; 
        const result = component.isAdmin();
        expect(result).toBeFalse();
    });
});
