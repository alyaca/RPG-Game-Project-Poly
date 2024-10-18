import { ComponentFixture, TestBed } from '@angular/core/testing';
import { mockLobbyPlayers } from '@app/mocks/mock-lobby-players';
import { Player } from '@common/player';
import { LobbyPlayerComponent } from './lobby-player.component';
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
