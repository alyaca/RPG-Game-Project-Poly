import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LobbyPlayerComponent } from './lobby-player.component';
import { PlayerObjects } from '@app/interfaces/playerObject';
import { PLAYERS } from '@app/constants';

describe('LobbyPlayerComponent', () => {
    let component: LobbyPlayerComponent;
    let fixture: ComponentFixture<LobbyPlayerComponent>;

    const mockLobbyPlayer: PlayerObjects = PLAYERS[0];

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
