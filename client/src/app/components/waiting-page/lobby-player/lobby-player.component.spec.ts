import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LobbyPlayerComponent } from './lobby-player.component';
//import { PlayerObjects } from '@app/interfaces/playerObject';
import { Player } from '@common/player';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';

describe('LobbyPlayerComponent', () => {
    let component: LobbyPlayerComponent;
    let fixture: ComponentFixture<LobbyPlayerComponent>;

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
});
